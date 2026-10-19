import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { DataSourceOptions } from 'typeorm';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const connection: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '1234567',
  database: process.env.DB_NAME ?? 'home_work_14',
  entities: [join(__dirname, 'Entities', '*.entity{.ts,.js}')],
  synchronize: true,
};
