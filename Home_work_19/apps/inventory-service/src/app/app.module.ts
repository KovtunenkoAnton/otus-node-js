import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagingModule } from '../../../../libs/messaging/src/index.js';
import { connection } from '../db/connection.js';
import { DedupService } from '../dedup/dedup.service.js';
import { ProcessedMessage } from '../dedup/processed-message.entity.js';
import { Product } from '../product/product.entity.js';
import { ProductSeeder } from '../product/product-seeder.js';
import { ProductService } from '../product/product.service.js';
import { InventoryController } from '../saga/inventory.controller.js';

@Module({
  imports: [
    TypeOrmModule.forRoot(connection),
    TypeOrmModule.forFeature([Product, ProcessedMessage]),
    MessagingModule,
  ],
  controllers: [InventoryController],
  providers: [ProductService, ProductSeeder, DedupService],
})
export class AppModule {}
