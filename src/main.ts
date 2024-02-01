import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { GlobalExceptionsFilter } from './global-exception-filter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URI],
      queue: 'mail',
      queueOptions: {
        durable: false,
      },
    },
  });

  // Use the global exception filter
  app.useGlobalFilters(new GlobalExceptionsFilter());

  await app.listen();
}

bootstrap();
