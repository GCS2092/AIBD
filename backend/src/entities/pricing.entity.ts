import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PricingType {
  STANDARD = 'standard',
  PEAK_HOURS = 'peak_hours', // Heures de pointe
  NIGHT = 'night', // Nuit
  SPECIAL = 'special', // Tarif spécial
}

@Entity('pricing')
export class Pricing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string; // Ex: "Dakar → Aéroport Standard"

  @Column({ type: 'varchar', length: 50 })
  rideType: string; // 'dakar_to_airport' ou 'airport_to_dakar'

  @Column({ type: 'varchar', length: 50, nullable: true })
  tripType: string; // 'aller_retour' | 'aller_simple' | 'retour_simple'

  @Column({
    type: 'enum',
    enum: PricingType,
    default: PricingType.STANDARD,
  })
  type: PricingType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // Prix en FCFA

  @Column({ type: 'varchar', length: 20, nullable: true })
  startTime: string; // Format: "HH:mm" pour heures de pointe/nuit

  @Column({ type: 'varchar', length: 20, nullable: true })
  endTime: string; // Format: "HH:mm"

  @Column({ type: 'json', nullable: true })
  daysOfWeek: number[]; // [0-6] 0 = Dimanche, null = tous les jours

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

