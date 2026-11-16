import { Injectable } from '@nestjs/common';

@Injectable()
export class DedupService {
  private readonly processed = new Set<string>();

  async isProcessed(messageId: string): Promise<boolean> {
    return this.processed.has(messageId);
  }

  async markProcessed(messageId: string, _topic: string): Promise<void> {
    this.processed.add(messageId);
  }
}
