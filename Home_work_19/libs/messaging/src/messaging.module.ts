import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { getKafkaBrokers, KAFKA_CLIENT } from './kafka-options';
import { KafkaPublisher } from './publisher.service';
import { MessageConsumer } from './message-consumer.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: KAFKA_CLIENT,
        transport: Transport.KAFKA,
        options: {
          client: { brokers: getKafkaBrokers() },
          producerOnlyMode: true,
        },
      },
    ]),
  ],
  providers: [KafkaPublisher, MessageConsumer],
  exports: [KafkaPublisher, MessageConsumer],
})
export class MessagingModule {}
