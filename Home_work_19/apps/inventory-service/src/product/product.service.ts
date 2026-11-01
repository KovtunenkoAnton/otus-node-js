import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Product } from './product.entity.js';

export class ProductNotFoundError extends Error {
  constructor(productId: string) {
    super(`product ${productId} not found`);
  }
}

export class InsufficientStockError extends Error {
  constructor(product: Product, available: number, quantity: number) {
    super(`product "${product.name}": available ${available}, requested ${quantity}`);
  }
}

@Injectable()
export class ProductService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async reserve(productId: string, quantity: number): Promise<Product> {
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, { where: { id: productId } });
      if (!product) throw new ProductNotFoundError(productId);
      const available = product.stock - product.reserved;
      if (available < quantity) {
        throw new InsufficientStockError(product, available, quantity);
      }
      product.reserved += quantity;
      return manager.save(product);
    });
  }

  async release(productId: string, quantity: number): Promise<Product> {
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, { where: { id: productId } });
      if (!product) throw new ProductNotFoundError(productId);
      product.reserved = Math.max(0, product.reserved - quantity);
      return manager.save(product);
    });
  }
}
