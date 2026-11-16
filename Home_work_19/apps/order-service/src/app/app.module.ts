import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagingModule } from '../../../../libs/messaging/src/index.js';
import { connection } from '../db/connection.js';
import { DedupService } from '../dedup/dedup.service.js';
import { ProcessedMessage } from '../dedup/processed-message.entity.js';
import { Order } from '../order/order.entity.js';
import { OrderService } from '../order/order.service.js';
import { SagaController } from '../saga/saga.controller.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    TypeOrmModule.forRoot(connection),
    TypeOrmModule.forFeature([Order, ProcessedMessage]),
    MessagingModule,
  ],
  controllers: [AppController, SagaController],
  providers: [AppService, OrderService, DedupService],
})
export class AppModule {}
