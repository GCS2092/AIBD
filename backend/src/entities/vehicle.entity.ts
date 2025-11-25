import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Driver } from './driver.entity';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  driverId: string;

  @ManyToOne(() => Driver, (driver) => driver.vehicles)
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  @Column({ type: 'varchar', length: 100 })
  brand: string; // Marque

  @Column({ type: 'varchar', length: 100 })
  model: string; // Modèle

  @Column({ type: 'varchar', length: 50, unique: true })
  licensePlate: string; // Immatriculation

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string;

  @Column({ type: 'int', nullable: true })
  year: number;

  @Column({ type: 'int', nullable: true })
  capacity: number; // Nombre de places

  @Column({ type: 'varchar', length: 500, nullable: true })
  photoUrl: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

