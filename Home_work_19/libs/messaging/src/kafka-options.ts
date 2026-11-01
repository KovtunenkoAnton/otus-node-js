import { MicroserviceOptions, Transport } from '@nestjs/microservices';

export const KAFKA_CLIENT = 'KAFKA_CLIENT';

export function getKafkaBrokers(): string[] {
  return (process.env.KAFKA_BROKERS ?? 'localhost:9092')
    .split(',')
    .map((broker) => broker.trim());
}

export function getKafkaOptions(groupId: string): MicroserviceOptions {
  return {
    transport: Transport.KAFKA,
    options: {
      client: { brokers: getKafkaBrokers() },
      consumer: { groupId },
      subscribe: { fromBeginning: true },
    },
  };
}
