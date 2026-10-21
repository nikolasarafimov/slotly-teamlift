import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('slots')
export class Slot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_slots_starts_at')
  @Column({
    name: 'starts_at',
    type: 'timestamptz',
  })
  startsAt!: Date;

  @Column({
    name: 'duration_minutes',
    type: 'int',
  })
  durationMinutes!: number;

  @Column({
    name: 'is_booked',
    type: 'boolean',
    default: false,
  })
  isBooked!: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;
}