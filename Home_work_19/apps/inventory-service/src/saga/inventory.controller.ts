import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import {
  TOPICS,
  inventoryFailedMessage,
  inventoryReleaseMessage,
  inventoryReserveMessage,
  inventoryReservedMessage,
} from '../../../../libs/contracts/src/index.js';
import type { Message, MessageDefinition } from '../../../../libs/contracts/src/index.js';
import {
  KafkaPublisher,
  MessageConsumer,
} from '../../../../libs/messaging/src/index.js';
import { DedupService } from '../dedup/dedup.service.js';
import { ProductService } from '../product/product.service.js';

@Controller()
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(
    private readonly products: ProductService,
    private readonly dedup: DedupService,
    private readonly publisher: KafkaPublisher,
    private readonly consumer: MessageConsumer,
  ) {}

  @MessagePattern(TOPICS.inventoryReserve)
  onReserve(raw: unknown) {
    return this.consumeOnce(inventoryReserveMessage, raw, async (msg) => {
      const { orderId, productId, quantity } = msg.payload;
      try {
        await this.products.reserve(productId, quantity);
        this.publisher.publish(
          inventoryReservedMessage,
          { orderId, productId, quantity },
          msg.correlationId,
        );
        this.logger.log(`order ${orderId}: reserved ${quantity} → inventory.reserved`);
      } catch (err) {
        const reason = describeError(err);
        this.publisher.publish(
          inventoryFailedMessage,
          { orderId, productId, quantity, reason },
          msg.correlationId,
        );
        this.logger.warn(`order ${orderId}: ${reason} → inventory.failed`);
      }
    });
  }

  @MessagePattern(TOPICS.inventoryRelease)
  onRelease(raw: unknown) {
    return this.consumeOnce(inventoryReleaseMessage, raw, async (msg) => {
      const { orderId, productId, quantity } = msg.payload;
      try {
        await this.products.release(productId, quantity);
        this.logger.log(`order ${orderId}: released ${quantity} (compensation)`);
      } catch (err) {
        this.logger.warn(`order ${orderId}: release failed: ${describeError(err)}`);
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

function describeError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
