import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ride } from './ride.entity';
import { Driver } from './driver.entity';

export enum RideAssignmentStatus {
  OFFERED = 'offered', // Proposé au chauffeur
  ACCEPTED = 'accepted', // Accepté
  REFUSED = 'refused', // Refusé
  TIMEOUT = 'timeout', // Timeout (pas de réponse)
}

@Entity('ride_assignments')
export class RideAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  rideId: string;

  @ManyToOne(() => Ride, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rideId' })
  ride: Ride;

  @Column({ type: 'uuid' })
  driverId: string;

  @ManyToOne(() => Driver, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  @Column({
    type: 'varchar',
    length: 50,
  })
  status: RideAssignmentStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  offeredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date;

  @Column({ type: 'text', nullable: true })
  refusalReason: string | null;

  @CreateDateColumn()
  createdAt: Date;
}

