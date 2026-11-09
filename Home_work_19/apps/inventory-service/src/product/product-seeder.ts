import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity.js';

const SEED_PRODUCTS = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Coffee', stock: 10 },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Cup', stock: 2 },
];

@Injectable()
export class ProductSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(ProductSeeder.name);

  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    for (const seed of SEED_PRODUCTS) {
      const exists = await this.products.findOne({ where: { id: seed.id } });
      if (!exists) {
        await this.products.save(this.products.create(seed));
        this.logger.log(
          `seeded product ${seed.id} (${seed.name}) stock=${seed.stock}`,
        );
      }
    }
  }
}
