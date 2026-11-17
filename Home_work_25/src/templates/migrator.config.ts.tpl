import type { MigratorConfig } from '../src/config.js';

const config: MigratorConfig = {
  database: process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/mydb',
  migrationsDir: './migrations',
  pattern: '\\.ts$',
  storage: 'sequelize',
  transaction: 'each',
  logger: 'pretty',
};

export default config;