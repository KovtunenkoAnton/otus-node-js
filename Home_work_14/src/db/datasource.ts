import { DataSource } from 'typeorm';
import { connection } from './connection.js';

export default new DataSource(connection);
