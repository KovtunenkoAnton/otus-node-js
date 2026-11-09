import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum OrderStatus {
  Pending = 'PENDING',
  Confirmed = 'CONFIRMED',
  Rejected = 'REJECTED',
  Cancelled = 'CANCELLED',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'float8' })
  amount: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Pending })
  status: OrderStatus;

  @Column({ type: 'varchar', nullable: true })
  reason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
