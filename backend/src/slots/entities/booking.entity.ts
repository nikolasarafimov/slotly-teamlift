import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Slot } from './slot.entity';

@Entity('bookings')
@Index('UQ_bookings_slot_id', ['slotId'], {
  unique: true,
})
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'slot_id',
    type: 'uuid',
  })
  slotId!: string;

  @ManyToOne(() => Slot, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'slot_id',
  })
  slot!: Slot;

  @Column({
    name: 'guest_name',
    type: 'varchar',
    length: 100,
  })
  guestName!: string;

  @Column({
    name: 'guest_email',
    type: 'varchar',
    length: 254,
  })
  guestEmail!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;
}