import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('processed_messages')
export class ProcessedMessage {
  @PrimaryColumn({ type: 'varchar' })
  messageId: string;

  @Column({ type: 'varchar' })
  topic: string;

  @CreateDateColumn()
  processedAt: Date;
}
