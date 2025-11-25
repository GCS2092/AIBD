import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad,
} from 'typeorm';
import { User } from './user.entity';
import { Vehicle } from './vehicle.entity';
import { Ride } from './ride.entity';
import { EncryptionService } from '../encryption/encryption.service';

export enum DriverStatus {
  AVAILABLE = 'available',
  ON_RIDE = 'on_ride',
  UNAVAILABLE = 'unavailable',
  ON_BREAK = 'on_break',
}

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.driver)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 500, nullable: true }) // Augmenté pour chiffré
  licenseNumber: string;

  @Column({
    type: 'enum',
    enum: DriverStatus,
    default: DriverStatus.UNAVAILABLE,
  })
  status: DriverStatus;

  @Column({ type: 'int', default: 0 })
  consecutiveRides: number;

  @Column({ type: 'int', default: 0 })
  totalRides: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  @Column({ type: 'varchar', length: 500, nullable: true }) // Augmenté pour chiffré
  serviceZone: string; // Zone de service (peut être une zone géographique)

  @Column({ type: 'json', nullable: true })
  workSchedule: {
    start: string; // Format: "HH:mm"
    end: string; // Format: "HH:mm"
    days: number[]; // [0-6] 0 = Dimanche
  };

  @Column({ type: 'varchar', length: 500, nullable: true })
  registrationToken: string; // Token unique pour l'inscription

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.driver)
  vehicles: Vehicle[];

  @OneToMany(() => Ride, (ride) => ride.driver)
  rides: Ride[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Service d'encryption
  private encryptionService?: EncryptionService;

  setEncryptionService(service: EncryptionService) {
    this.encryptionService = service;
  }

  @BeforeInsert()
  @BeforeUpdate()
  encryptSensitiveData() {
    if (!this.encryptionService) return;

    if (this.licenseNumber) {
      this.licenseNumber = this.encryptionService.encrypt(this.licenseNumber);
    }
  }

  @AfterLoad()
  decryptSensitiveData() {
    if (!this.encryptionService) return;

    // Déchiffrer le numéro de permis seulement s'il est chiffré (contient ':')
    if (this.licenseNumber && typeof this.licenseNumber === 'string' && this.licenseNumber.includes(':')) {
      try {
        this.licenseNumber = this.encryptionService.decrypt(this.licenseNumber);
      } catch (e) {
        // Si le déchiffrement échoue, garder la valeur originale
        console.warn('Erreur déchiffrement licenseNumber dans Driver entity:', e);
      }
    }
  }
}
