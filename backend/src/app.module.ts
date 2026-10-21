import { Module } from '@nestjs/common';

import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';

import { APP_GUARD } from '@nestjs/core';

import { TypeOrmModule } from '@nestjs/typeorm';

import {
  ThrottlerGuard,
  ThrottlerModule,
} from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { DbHealthController } from './db-health.controller';

import { SlotsModule } from './slots/slots.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,

        host: config.getOrThrow<string>('DB_HOST'),

        port: Number(
          config.getOrThrow<string>('DB_PORT'),
        ),

        username: config.getOrThrow<string>(
          'DB_USERNAME',
        ),

        password: config.getOrThrow<string>(
          'DB_PASSWORD',
        ),

        database: config.getOrThrow<string>(
          'DB_NAME',
        ),

        autoLoadEntities: true,

        synchronize:
          config.get<string>('NODE_ENV') ===
          'development',

        retryAttempts: 5,
        retryDelay: 3000,
      }),
    }),

    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000,
          limit: 60,
        },
      ],
    }),

    SlotsModule,
  ],

  controllers: [
    AppController,
    DbHealthController,
  ],

  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}