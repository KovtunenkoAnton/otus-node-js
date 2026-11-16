import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import {
  TOPICS,
  inventoryFailedMessage,
  inventoryReleaseMessage,
  inventoryReserveMessage,
  inventoryReservedMessage,
  notificationSendMessage,
  orderConfirmedMessage,
  orderCreateMessage,
  orderRejectedMessage,
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
import { Order } from '../order/order.entity.js';
import { OrderService } from '../order/order.service.js';

@Controller()
export class SagaController {
  private readonly logger = new Logger(SagaController.name);

  constructor(
    private readonly orders: OrderService,
    private readonly dedup: DedupService,
    private readonly publisher: KafkaPublisher,
    private readonly consumer: MessageConsumer,
  ) {}

  @MessagePattern(TOPICS.orderCreate)
  onOrderCreate(raw: unknown) {
    return this.consumeOnce(orderCreateMessage, raw, (msg) => {
      const { orderId, productId, quantity } = msg.payload;
      this.publisher.publish(
        inventoryReserveMessage,
        { orderId, productId, quantity },
        orderId,
      );
      this.logger.log(`order ${orderId}: → inventory.reserve qty=${quantity}`);
    });
  }

  @MessagePattern(TOPICS.inventoryReserved)
  onInventoryReserved(raw: unknown) {
    return this.consumeOnce(inventoryReservedMessage, raw, async (msg) => {
      const { orderId } = msg.payload;
      const order = await this.orders.mustFind(orderId);
      this.publisher.publish(
        paymentAuthorizeMessage,
        { orderId, amount: order.amount },
        orderId,
      );
      this.logger.log(`order ${orderId}: товар зарезервирован → payment.authorize`);
    });
  }

  @MessagePattern(TOPICS.paymentAuthorized)
  onPaymentAuthorized(raw: unknown) {
    return this.consumeOnce(paymentAuthorizedMessage, raw, async (msg) => {
      const { orderId } = msg.payload;
      await this.orders.mustFind(orderId);
      await this.orders.confirm(orderId);
      this.publisher.publish(orderConfirmedMessage, { orderId }, orderId);
      this.publisher.publish(
        notificationSendMessage,
        { orderId, message: `Заказ ${orderId} подтверждён` },
        orderId,
      );
      this.logger.log(`order ${orderId}: → CONFIRMED, order.confirmed + notification.send`);
    });
  }

  @MessagePattern(TOPICS.paymentFailed)
  onPaymentFailed(raw: unknown) {
    return this.consumeOnce(paymentFailedMessage, raw, async (msg) => {
      const { orderId, reason } = msg.payload;
      const order = await this.orders.mustFind(orderId);
      this.releaseInventory(order, orderId);
      await this.rejectOrder(orderId, `payment failed: ${reason}`);
    });
  }

  @MessagePattern(TOPICS.inventoryFailed)
  onInventoryFailed(raw: unknown) {
    return this.consumeOnce(inventoryFailedMessage, raw, async (msg) => {
      const { orderId, reason } = msg.payload;
      await this.orders.mustFind(orderId);
      await this.rejectOrder(orderId, `inventory reserve failed: ${reason}`);
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

  private releaseInventory(order: Order, orderId: string): void {
    this.publisher.publish(
      inventoryReleaseMessage,
      { orderId, productId: order.productId, quantity: order.quantity },
      orderId,
    );
    this.logger.log(`order ${orderId}: компенсация → inventory.release`);
  }

  private async rejectOrder(orderId: string, reason: string): Promise<void> {
    await this.orders.reject(orderId, reason);
    this.publisher.publish(orderRejectedMessage, { orderId, reason }, orderId);
    this.logger.log(`order ${orderId}: → REJECTED (${reason})`);
  }
}
