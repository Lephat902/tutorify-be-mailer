import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://rabbitmq:5672'],
      queue: 'mail',
      queueOptions: {
        durable: false,
      },
//      noAck: false,
//      prefetchCount: 1,
    },
  });
  await app.listen();
}

bootstrap();
