import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Slot } from './entities/slot.entity';
import { Booking } from './entities/booking.entity';

import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';

import { HostKeyGuard } from './guards/host-key.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Slot,
      Booking,
    ]),
  ],
  controllers: [
    SlotsController,
  ],
  providers: [
    SlotsService,
    HostKeyGuard,
  ],
  exports: [
    SlotsService,
  ],
})
export class SlotsModule {}