import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcessedMessage } from './processed-message.entity.js';

@Injectable()
export class DedupService {
  constructor(
    @InjectRepository(ProcessedMessage) private readonly repo: Repository<ProcessedMessage>,
  ) {}

  isProcessed(messageId: string): Promise<boolean> {
    return this.repo.findOne({ where: { messageId } }).then((row) => row !== null);
  }

  markProcessed(messageId: string, topic: string): Promise<unknown> {
    return this.repo.query(
      'INSERT INTO processed_messages ("messageId", "topic", "processedAt") ' +
        'VALUES ($1, $2, NOW()) ON CONFLICT ("messageId") DO NOTHING',
      [messageId, topic],
    );
  }
}
