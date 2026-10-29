import { DataSourceOptions } from 'typeorm';
import { Comment } from './Entities/Comment.entity.js';
import { Tag } from './Entities/Tag.entity.js';
import { Task } from './Entities/Task.entity.js';
import { User } from './Entities/User.entity.js';

export const connection: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '1234567',
  database: process.env.DB_NAME ?? 'home_work_14',
  entities: [Comment, Tag, Task, User],
  synchronize: true,
};
