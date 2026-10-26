const envPort = process.env.PORT ? Number(process.env.PORT) : 3000;

export const config = {
  port: Number.isNaN(envPort) ? 3000 : envPort,
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/home_work_10',
} as const;
