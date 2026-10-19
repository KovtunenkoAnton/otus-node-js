import { DataSource } from 'typeorm';
import { connection } from './connection.js';

export const providers = {
  provide: 'HOME_WORK_14',
  useFactory: async () => {
    const dataSource = new DataSource(connection);
    return dataSource.initialize();
  },
};
