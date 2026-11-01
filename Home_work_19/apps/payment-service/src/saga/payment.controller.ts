import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import {
  TOPICS,
  paymentAuthorizeMessage,
  paymentAuthorizedMessage,
  paymentFailedMessage,
} from '../../../../libs/contracts/src/index.js';
import type { Message, MessageDefinition } from '../../../../libs/contracts/src/index.js';
import {
  KafkaPublisher,
  MessageConsumer,
} from '../../../../libs/messaging/src/index.js';
import { DedupService } from '../dedup/dedup.service.js';
import { PaymentService } from '../payment/payment.service.js';

@Controller()
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly payments: PaymentService,
    private readonly dedup: DedupService,
    private readonly publisher: KafkaPublisher,
    private readonly consumer: MessageConsumer,
  ) {}

  @MessagePattern(TOPICS.paymentAuthorize)
  onAuthorize(raw: unknown) {
    return this.consumeOnce(paymentAuthorizeMessage, raw, (msg) => {
      const { orderId, amount } = msg.payload;
      const result = this.payments.authorize(amount);
      if (result.ok) {
        this.publisher.publish(
          paymentAuthorizedMessage,
          { orderId, amount, paymentId: result.paymentId },
          msg.correlationId,
        );
        this.logger.log(`order ${orderId}: authorized ${amount} → payment.authorized`);
      } else {
        this.publisher.publish(
          paymentFailedMessage,
          { orderId, amount, reason: result.reason },
          msg.correlationId,
        );
        this.logger.warn(`order ${orderId}: ${result.reason} → payment.failed`);
      }
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
