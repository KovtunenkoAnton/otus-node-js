import { Module } from '@nestjs/common';
import { MessagingModule } from '../../../../libs/messaging/src/index.js';
import { DedupService } from '../dedup/dedup.service.js';
import { PaymentService } from '../payment/payment.service.js';
import { PaymentController } from '../saga/payment.controller.js';

@Module({
  imports: [MessagingModule],
  controllers: [PaymentController],
  providers: [PaymentService, DedupService],
})
export class AppModule {}
