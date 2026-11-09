import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { z } from 'zod';
import { Order, OrderStatus } from './order.entity.js';

@Injectable()
export class OrderService {
  constructor(@InjectRepository(Order) private readonly orders: Repository<Order>) {}

  create(input: { productId: string; quantity: number; amount: number }): Promise<Order> {
    return this.orders.save(this.orders.create({ ...input, status: OrderStatus.Pending }));
  }

  findById(id: string): Promise<Order | null> {
    return this.orders.findOne({ where: { id } });
  }

  async maybeFindUuid(id: string): Promise<Order | null> {
    if (!z.uuid().safeParse(id).success) return null;
    return this.findById(id);
  }

  async mustFind(id: string): Promise<Order> {
    const order = await this.maybeFindUuid(id);
    if (!order) throw new Error(`order ${id} not found`);
    return order;
  }

  confirm(id: string): Promise<Order> {
    return this.transition(id, OrderStatus.Confirmed);
  }

  reject(id: string, reason: string): Promise<Order> {
    return this.transition(id, OrderStatus.Rejected, reason);
  }

  cancel(id: string, reason: string): Promise<Order> {
    return this.transition(id, OrderStatus.Cancelled, reason);
  }

  private async transition(id: string, to: OrderStatus, reason?: string): Promise<Order> {
    const order = await this.mustFind(id);
    if (order.status !== OrderStatus.Pending) {
      throw new Error(`order ${id} is ${order.status}, expected ${OrderStatus.Pending}`);
    }
    order.status = to;
    if (reason) order.reason = reason;
    return this.orders.save(order);
  }
}
