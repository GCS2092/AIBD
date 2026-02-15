import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Ride } from './ride.entity';

export enum InternalNotificationType {
  RIDE_CREATED = 'ride_created',
  RIDE_ACCEPTED = 'ride_accepted',
  RIDE_REFUSED = 'ride_refused',
  RIDE_STARTED = 'ride_started',
  RIDE_COMPLETED = 'ride_completed',
  RIDE_CANCELLED = 'ride_cancelled',
  DRIVER_ASSIGNED = 'driver_assigned',
  DRIVER_VERIFIED = 'driver_verified',
  PAYMENT_RECEIVED = 'payment_received',
  REFUND_PROCESSED = 'refund_processed',
  SYSTEM_ALERT = 'system_alert',
}

@Entity('internal_notifications')
export class InternalNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: InternalNotificationType,
  })
  type: InternalNotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'uuid', nullable: true })
  rideId: string | null;

  @ManyToOne(() => Ride, { nullable: true })
  @JoinColumn({ name: 'rideId' })
  ride?: Ride;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

