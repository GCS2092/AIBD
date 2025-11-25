import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CancellationType {
  CLIENT = 'client',
  DRIVER = 'driver',
  ADMIN = 'admin',
  SYSTEM = 'system',
}

@Entity('cancellations')
export class Cancellation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  rideId: string;

  @Column({
    type: 'enum',
    enum: CancellationType,
  })
  cancelledBy: CancellationType;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'boolean', default: false })
  refunded: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

