import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class DbHealthController {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  async checkHealth() {
    await this.dataSource.query('SELECT 1 AS ok');

    return {
      status: 'ok',
      service: 'slotly-api',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}