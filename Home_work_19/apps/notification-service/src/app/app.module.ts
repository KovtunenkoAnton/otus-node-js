import { Module } from '@nestjs/common';
import { MessagingModule } from '../../../../libs/messaging/src/index.js';
import { DedupService } from '../dedup/dedup.service.js';
import { NotificationController } from '../saga/notification.controller.js';

@Module({
  imports: [MessagingModule],
  controllers: [NotificationController],
  providers: [DedupService],
})
export class AppModule {}
