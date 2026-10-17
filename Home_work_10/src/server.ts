import mongoose from 'mongoose';
import { createApp } from './app.js';
import { config } from './config.js';
import { createRouters } from './composition.js';

const start = async (): Promise<void> => {
  await mongoose.connect(config.mongoUri);

  const app = createApp(createRouters());
  const server = app.listen(config.port, () => {
    console.log('Сервак стартанул, база рванула');
  });

  process.on('SIGTERM', () => {
    server.close(() => {
      void mongoose.disconnect().then(() => process.exit(0));
    });
  });
};

start().catch((err: unknown) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
