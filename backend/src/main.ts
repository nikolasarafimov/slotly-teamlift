import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.setGlobalPrefix('api');

  app.enableCors({
    origin:
      process.env.FRONTEND_URL ??
      'http://localhost:5173',

    methods: [
      'GET',
      'POST',
      'PATCH',
      'DELETE',
    ],

    allowedHeaders: [
      'Content-Type',
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(
    process.env.PORT ?? 3000,
  );

  await app.listen(port, '0.0.0.0');

  console.log(
    `Slotly API running on port ${port}`,
  );
}

void bootstrap();