import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  DataSource,
  Repository,
} from 'typeorm';

import { Slot } from './entities/slot.entity';
import { Booking } from './entities/booking.entity';

import { CreateSlotDto } from './dto/create-slot.dto';
import { BookSlotDto } from './dto/book-slot.dto';

@Injectable()
export class SlotsService {
  constructor(
    @InjectRepository(Slot)
    private readonly slotsRepository: Repository<Slot>,

    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateSlotDto): Promise<Slot> {
    const startsAt = new Date(dto.startsAt);

    if (
      !Number.isFinite(startsAt.getTime()) ||
      startsAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException(
        'The slot must start in the future.',
      );
    }

    const endsAt = new Date(
      startsAt.getTime() +
        dto.durationMinutes * 60_000,
    );

    return this.dataSource.transaction(
      async (manager) => {
        await manager.query(
          'SELECT pg_advisory_xact_lock($1::bigint)',
          [7123456],
        );

        const overlaps: { id: string }[] =
          await manager.query(
            `
            SELECT id
            FROM slots
            WHERE starts_at < $1::timestamptz
              AND (
                starts_at +
                duration_minutes * INTERVAL '1 minute'
              ) > $2::timestamptz
            LIMIT 1
            `,
            [
              endsAt.toISOString(),
              startsAt.toISOString(),
            ],
          );

        if (overlaps.length > 0) {
          throw new ConflictException(
            'This slot overlaps an existing slot.',
          );
        }

        const slot = manager.create(Slot, {
          startsAt,
          durationMinutes: dto.durationMinutes,
          isBooked: false,
        });

        return manager.save(Slot, slot);
      },
    );
  }

  async findAvailable(): Promise<Slot[]> {
    return this.slotsRepository
      .createQueryBuilder('slot')
      .where('slot.isBooked = :isBooked', {
        isBooked: false,
      })
      .andWhere('slot.startsAt > NOW()')
      .orderBy('slot.startsAt', 'ASC')
      .getMany();
  }

  async findAll(): Promise<Slot[]> {
    return this.slotsRepository.find({
      order: {
        startsAt: 'ASC',
      },
    });
  }

  async book(id: string, dto: BookSlotDto) {
    return this.dataSource.transaction(
      async (manager) => {
        const updateResult = await manager
          .createQueryBuilder()
          .update(Slot)
          .set({
            isBooked: true,
          })
          .where('id = :id', { id })
          .andWhere('is_booked = false')
          .andWhere('starts_at > NOW()')
          .execute();

        if (updateResult.affected !== 1) {
          const existingSlot = await manager.findOneBy(
            Slot,
            { id },
          );

          if (!existingSlot) {
            throw new NotFoundException(
              'The requested slot does not exist.',
            );
          }

          if (existingSlot.isBooked) {
            throw new ConflictException(
              'This slot has already been booked.',
            );
          }

          throw new BadRequestException(
            'This slot is no longer available.',
          );
        }

        const booking = manager.create(Booking, {
          slotId: id,
          guestName: dto.name,
          guestEmail: dto.email,
        });

        const savedBooking = await manager.save(
          Booking,
          booking,
        );

        const updatedSlot = await manager.findOneByOrFail(
          Slot,
          { id },
        );

        return {
          message: 'Booking confirmed successfully.',
          booking: {
            id: savedBooking.id,
            slotId: savedBooking.slotId,
            name: savedBooking.guestName,
            email: savedBooking.guestEmail,
            createdAt: savedBooking.createdAt,
          },
          slot: updatedSlot,
        };
      },
    );
  }
}