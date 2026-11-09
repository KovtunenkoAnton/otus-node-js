import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { createMessage, Message, MessageDefinition } from '../../contracts/src';
import { KAFKA_CLIENT } from './kafka-options';

@Injectable()
export class KafkaPublisher {
  private readonly logger = new Logger(KafkaPublisher.name);

  constructor(@Inject(KAFKA_CLIENT) private readonly client: ClientProxy) {}

  publish<TType extends string, TPayload>(
    def: MessageDefinition<TType, TPayload>,
    payload: TPayload,
    correlationId: string,
    messageId?: string,
  ): Message<TType, TPayload> {
    const message = createMessage(def, payload, correlationId, messageId);

    this.client.emit(def.topic, message).subscribe({
      error: (err: unknown) =>
        this.logger.error(
          `publish "${def.topic}" failed: ${err instanceof Error ? err.message : String(err)}`,
        ),
    });

    return message;
  }
}
