import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import { Throttle } from '@nestjs/throttler';

import { SlotsService } from './slots.service';

import { CreateSlotDto } from './dto/create-slot.dto';
import { BookSlotDto } from './dto/book-slot.dto';

@Controller('slots')
export class SlotsController {
  constructor(
    private readonly slotsService: SlotsService,
  ) {}

  @Post()
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  create(@Body() dto: CreateSlotDto) {
    return this.slotsService.create(dto);
  }

  @Get()
  findAvailable() {
    return this.slotsService.findAvailable();
  }

  @Get('all')
  findAll() {
    return this.slotsService.findAll();
  }

  @Post(':id/book')
  @Throttle({
    default: {
      limit: 10,
      ttl: 60_000,
    },
  })
  book(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BookSlotDto,
  ) {
    return this.slotsService.book(id, dto);
  }
}