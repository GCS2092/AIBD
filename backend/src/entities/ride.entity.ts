import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad,
} from 'typeorm';
import { Driver } from './driver.entity';
import { Pricing } from './pricing.entity';
import { EncryptionService } from '../encryption/encryption.service';

export enum RideStatus {
  PENDING = 'pending', // En attente d'attribution
  ASSIGNED = 'assigned', // Chauffeur assigné
  ACCEPTED = 'accepted', // Chauffeur a accepté
  DRIVER_ON_WAY = 'driver_on_way', // Chauffeur en route
  PICKED_UP = 'picked_up', // Client pris en charge
  IN_PROGRESS = 'in_progress', // Course en cours
  COMPLETED = 'completed', // Terminée
  CANCELLED = 'cancelled', // Annulée
}

export enum RideType {
  DAKAR_TO_AIRPORT = 'dakar_to_airport',
  AIRPORT_TO_DAKAR = 'airport_to_dakar',
}

@Entity('rides')
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 }) // Augmenté pour chiffré
  clientFirstName: string;

  @Column({ type: 'varchar', length: 200 }) // Augmenté pour chiffré
  clientLastName: string;

  @Column({ type: 'varchar', length: 500 }) // Augmenté pour chiffré
  clientPhone: string;

  // Phone hashé pour recherche
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'client_phone_hash' })
  clientPhoneHash?: string;

  @Column({ type: 'varchar', length: 500, nullable: true }) // Augmenté pour chiffré
  clientEmail: string;

  // Email hashé pour recherche
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'client_email_hash' })
  clientEmailHash?: string;

  @Column({ type: 'varchar', length: 1000 }) // Augmenté pour chiffré
  pickupAddress: string; // Adresse de départ

  @Column({ type: 'varchar', length: 1000 }) // Augmenté pour chiffré
  dropoffAddress: string; // Adresse d'arrivée

  @Column({
    type: 'enum',
    enum: RideType,
  })
  rideType: RideType;

  @Column({ type: 'timestamp' })
  scheduledAt: Date; // Date et heure de la course

  @Column({ type: 'varchar', length: 200, nullable: true }) // Augmenté pour chiffré
  flightNumber: string; // Numéro de vol (optionnel)

  @Column({ type: 'uuid', nullable: true })
  driverId: string;

  @ManyToOne(() => Driver, (driver) => driver.rides, { nullable: true })
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  @Column({ type: 'uuid', nullable: true })
  pricingId: string;

  @ManyToOne(() => Pricing, { nullable: true })
  @JoinColumn({ name: 'pricingId' })
  pricing: Pricing;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // Prix de la course

  @Column({
    type: 'enum',
    enum: RideStatus,
    default: RideStatus.PENDING,
  })
  status: RideStatus;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt: Date; // Quand le chauffeur a été assigné

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date; // Quand le chauffeur a accepté

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date; // Quand la course a commencé

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date; // Quand la course s'est terminée

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'varchar', length: 1000, nullable: true }) // Augmenté pour chiffré
  cancellationReason: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  cancelledBy: string; // 'client', 'driver', 'admin'

  @Column({ type: 'json', nullable: true })
  driverLocation: {
    lat: number;
    lng: number;
    timestamp: Date;
  };

  @Column({ type: 'json', nullable: true })
  pickupLocation: {
    lat: number;
    lng: number;
  };

  @Column({ type: 'json', nullable: true })
  dropoffLocation: {
    lat: number;
    lng: number;
  };

  @Column({ type: 'int', nullable: true })
  rating: number; // Note de 1 à 5

  @Column({ type: 'text', nullable: true })
  review: string; // Commentaire du client

  @Column({ type: 'varchar', length: 8, unique: true })
  accessCode: string; // Code d'accès unique pour consulter la course

  @Column({ type: 'int', default: 0 })
  assignmentAttempts: number; // Nombre de tentatives d'assignation

  @Column({ type: 'timestamp', nullable: true })
  lastAssignmentAttempt: Date; // Dernière tentative d'assignation

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

    if (this.clientFirstName) {
      this.clientFirstName = this.encryptionService.encrypt(this.clientFirstName);
    }
    if (this.clientLastName) {
      this.clientLastName = this.encryptionService.encrypt(this.clientLastName);
    }
    if (this.clientPhone) {
      // Calculer le hash AVANT de chiffrer (pour recherche)
      this.clientPhoneHash = this.encryptionService.hashForSearch(this.clientPhone);
      // Puis chiffrer
      this.clientPhone = this.encryptionService.encrypt(this.clientPhone);
    }
    if (this.clientEmail) {
      // Calculer le hash AVANT de chiffrer (pour recherche)
      this.clientEmailHash = this.encryptionService.hashForSearch(this.clientEmail);
      // Puis chiffrer
      this.clientEmail = this.encryptionService.encrypt(this.clientEmail);
    }
    if (this.pickupAddress) {
      this.pickupAddress = this.encryptionService.encrypt(this.pickupAddress);
    }
    if (this.dropoffAddress) {
      this.dropoffAddress = this.encryptionService.encrypt(this.dropoffAddress);
    }
    if (this.flightNumber) {
      this.flightNumber = this.encryptionService.encrypt(this.flightNumber);
    }
    if (this.cancellationReason) {
      this.cancellationReason = this.encryptionService.encrypt(this.cancellationReason);
    }
  }

  @AfterLoad()
  decryptSensitiveData() {
    if (!this.encryptionService) return;

    // Déchiffrer seulement si les données sont chiffrées (contiennent ':')
    if (this.clientFirstName && typeof this.clientFirstName === 'string' && this.clientFirstName.includes(':')) {
      try {
        this.clientFirstName = this.encryptionService.decrypt(this.clientFirstName);
      } catch (e) {
        console.warn('Erreur déchiffrement clientFirstName:', e);
      }
    }
    if (this.clientLastName && typeof this.clientLastName === 'string' && this.clientLastName.includes(':')) {
      try {
        this.clientLastName = this.encryptionService.decrypt(this.clientLastName);
      } catch (e) {
        console.warn('Erreur déchiffrement clientLastName:', e);
      }
    }
    if (this.clientPhone && typeof this.clientPhone === 'string' && this.clientPhone.includes(':')) {
      try {
        this.clientPhone = this.encryptionService.decrypt(this.clientPhone);
      } catch (e) {
        console.warn('Erreur déchiffrement clientPhone:', e);
      }
    }
    if (this.clientEmail && typeof this.clientEmail === 'string' && this.clientEmail.includes(':')) {
      try {
        this.clientEmail = this.encryptionService.decrypt(this.clientEmail);
      } catch (e) {
        console.warn('Erreur déchiffrement clientEmail:', e);
      }
    }
    if (this.pickupAddress && typeof this.pickupAddress === 'string' && this.pickupAddress.includes(':')) {
      try {
        this.pickupAddress = this.encryptionService.decrypt(this.pickupAddress);
      } catch (e) {
        console.warn('Erreur déchiffrement pickupAddress:', e);
      }
    }
    if (this.dropoffAddress && typeof this.dropoffAddress === 'string' && this.dropoffAddress.includes(':')) {
      try {
        this.dropoffAddress = this.encryptionService.decrypt(this.dropoffAddress);
      } catch (e) {
        console.warn('Erreur déchiffrement dropoffAddress:', e);
      }
    }
    if (this.flightNumber && typeof this.flightNumber === 'string' && this.flightNumber.includes(':')) {
      try {
        this.flightNumber = this.encryptionService.decrypt(this.flightNumber);
      } catch (e) {
        console.warn('Erreur déchiffrement flightNumber:', e);
      }
    }
    if (this.cancellationReason && typeof this.cancellationReason === 'string' && this.cancellationReason.includes(':')) {
      try {
        this.cancellationReason = this.encryptionService.decrypt(this.cancellationReason);
      } catch (e) {
        console.warn('Erreur déchiffrement cancellationReason:', e);
      }
    }
  }
}
