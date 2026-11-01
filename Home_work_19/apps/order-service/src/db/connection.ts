import { DataSourceOptions } from 'typeorm';
import { ProcessedMessage } from '../dedup/processed-message.entity.js';
import { Order } from '../order/order.entity.js';

export const connection: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '1234567',
  database: process.env.ORDER_DB_NAME ?? 'home_work_19',
  entities: [Order, ProcessedMessage],
  synchronize: true,
};
