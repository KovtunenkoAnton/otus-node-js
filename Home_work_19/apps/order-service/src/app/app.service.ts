import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  orderCancelledMessage,
  orderCreateMessage,
} from '../../../../libs/contracts/src/index.js';
import { KafkaPublisher } from '../../../../libs/messaging/src/index.js';
import { Order, OrderStatus } from '../order/order.entity.js';
import { OrderService } from '../order/order.service.js';

@Injectable()
export class AppService {
  constructor(
    private readonly orders: OrderService,
    private readonly publisher: KafkaPublisher,
  ) {}

  async createOrder(input: {
    productId: string;
    quantity: number;
    amount: number;
  }): Promise<Order> {
    const order = await this.orders.create(input);
    this.publisher.publish(
      orderCreateMessage,
      {
        orderId: order.id,
        productId: input.productId,
        quantity: input.quantity,
        amount: input.amount,
      },
      order.id,
    );
    return order;
  }

  async getOrder(id: string): Promise<Order> {
    const order = await this.orders.maybeFindUuid(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async cancelOrder(id: string): Promise<Order> {
    const order = await this.orders.maybeFindUuid(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    if (order.status !== OrderStatus.Pending) {
      throw new ConflictException(
        `Order ${id} is ${order.status}, cancel is only possible from PENDING`,
      );
    }
    const cancelled = await this.orders.cancel(id, 'cancelled by the client');
    this.publisher.publish(
      orderCancelledMessage,
      { orderId: id, reason: 'cancelled by the client' },
      id,
    );
    return cancelled;
  }
}
