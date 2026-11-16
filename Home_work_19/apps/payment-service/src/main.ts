import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { getKafkaOptions } from '../../../libs/messaging/src/index.js';
import { AppModule } from './app/app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>(getKafkaOptions('payment-service'));
  await app.init();
  await app.startAllMicroservices();
}

void bootstrap();
