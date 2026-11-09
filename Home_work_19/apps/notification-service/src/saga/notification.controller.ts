import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import {
  TOPICS,
  notificationSendMessage,
  notificationSentMessage,
} from '../../../../libs/contracts/src/index.js';
import type { Message, MessageDefinition } from '../../../../libs/contracts/src/index.js';
import {
  KafkaPublisher,
  MessageConsumer,
} from '../../../../libs/messaging/src/index.js';
import { DedupService } from '../dedup/dedup.service.js';

@Controller()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    private readonly dedup: DedupService,
    private readonly publisher: KafkaPublisher,
    private readonly consumer: MessageConsumer,
  ) {}

  @MessagePattern(TOPICS.notificationSend)
  onSend(raw: unknown) {
    return this.consumeOnce(notificationSendMessage, raw, (msg) => {
      const { orderId, message } = msg.payload;
      this.logger.log(`email → client: order ${orderId}: ${message}`);
      this.publisher.publish(notificationSentMessage, { orderId }, msg.correlationId);
    });
  }

  private async consumeOnce<TType extends string, TPayload>(
    def: MessageDefinition<TType, TPayload>,
    raw: unknown,
    work: (msg: Message<TType, TPayload>) => Promise<void> | void,
  ): Promise<void> {
    return this.consumer.consume(def, raw, async (msg) => {
      if (await this.dedup.isProcessed(msg.messageId)) {
        this.logger.log(`topic ${def.topic}: duplicate messageId=${msg.messageId} — skipped`);
        return;
      }
      await work(msg);
      await this.dedup.markProcessed(msg.messageId, def.topic);
    });
  }
}
