import { DataSourceOptions } from 'typeorm';
import { ProcessedMessage } from '../dedup/processed-message.entity.js';
import { Product } from '../product/product.entity.js';

export const connection: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '1234567',
  database: process.env.INVENTORY_DB_NAME ?? 'home_work_19_inventory',
  entities: [Product, ProcessedMessage],
  synchronize: true,
};
