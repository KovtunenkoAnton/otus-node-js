import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ZodError } from 'zod';
import { dlqTopic, Message, MessageDefinition, parseMessage } from '../../contracts/src';
import { KAFKA_CLIENT } from './kafka-options';

export const MAX_ATTEMPTS = 3;

@Injectable()
export class MessageConsumer {
  private readonly logger = new Logger(MessageConsumer.name);
  private readonly attempts = new Map<string, number>();

  constructor(@Inject(KAFKA_CLIENT) private readonly client: ClientProxy) {}

  async consume<TType extends string, TPayload>(
    def: MessageDefinition<TType, TPayload>,
    raw: unknown,
    handler: (message: Message<TType, TPayload>) => Promise<void> | void,
  ): Promise<void> {
    let message: Message<TType, TPayload>;

    try {
      message = parseMessage(def, raw);
    } catch (error) {
      this.logger.error(
        `topic "${def.topic}": invalid message, sending to ${dlqTopic(def.topic)}: ${describeError(error)}`,
      );
      this.emit(dlqTopic(def.topic), raw);
      return;
    }

    try {
      await handler(message);
      this.attempts.delete(message.messageId);
    } catch (error) {
      const attempt = (this.attempts.get(message.messageId) ?? 0) + 1;

      if (attempt >= MAX_ATTEMPTS) {
        this.logger.error(
          `topic "${def.topic}" messageId=${message.messageId} (correlationId=${message.correlationId}): ` +
            `failed ${attempt} times, sending to ${dlqTopic(def.topic)}: ${describeError(error)}`,
        );
        this.attempts.delete(message.messageId);
        this.emit(dlqTopic(def.topic), message);
        return;
      }

      this.attempts.set(message.messageId, attempt);
      this.logger.warn(
        `topic "${def.topic}" messageId=${message.messageId}: attempt ${attempt}/${MAX_ATTEMPTS} failed: ` +
          `${describeError(error)}, republishing`,
      );
      this.emit(def.topic, { ...message, retryCount: attempt });
    }
  }

  private emit(topic: string, data: unknown): void {
    this.client.emit(topic, data).subscribe({
      error: (err: unknown) =>
        this.logger.error(
          `publish "${topic}" failed: ${err instanceof Error ? err.message : String(err)}`,
        ),
    });
  }
}

function describeError(error: unknown): string {
  if (error instanceof ZodError) {
    return `validation: ${error.issues.map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`).join('; ')}`;
  }
  return error instanceof Error ? error.message : String(error);
}
