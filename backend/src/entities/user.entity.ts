import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad,
} from 'typeorm';
import { Driver } from './driver.entity';
import { EncryptionService } from '../encryption/encryption.service';

export enum UserRole {
  ADMIN = 'admin',
  DRIVER = 'driver',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  // Email hashé pour recherche (non chiffré)
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'email_hash' })
  emailHash?: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 500 }) // Augmenté pour stocker le chiffré
  phone: string;

  // Phone hashé pour recherche (non chiffré)
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'phone_hash' })
  phoneHash?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.DRIVER,
  })
  role: UserRole;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @OneToOne(() => Driver, (driver) => driver.user, { cascade: true })
  @JoinColumn()
  driver?: Driver;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Service d'encryption (injecté via repository)
  private encryptionService?: EncryptionService;

  setEncryptionService(service: EncryptionService) {
    this.encryptionService = service;
  }

  @BeforeInsert()
  @BeforeUpdate()
  encryptSensitiveData() {
    if (!this.encryptionService) return;

    // Générer les hashs AVANT de chiffrer (pour recherche)
    if (this.email) {
      // Le hash doit être calculé sur l'email EN CLAIR pour la recherche
      this.emailHash = this.encryptionService.hashForSearch(this.email);
      // Puis chiffrer l'email
      this.email = this.encryptionService.encrypt(this.email);
    }
    if (this.phone) {
      // Le hash doit être calculé sur le téléphone EN CLAIR pour la recherche
      this.phoneHash = this.encryptionService.hashForSearch(this.phone);
      // Puis chiffrer le téléphone
      this.phone = this.encryptionService.encrypt(this.phone);
    }
  }

  @AfterLoad()
  decryptSensitiveData() {
    if (!this.encryptionService) return;

    // Déchiffrer email et téléphone
    if (this.email) {
      this.email = this.encryptionService.decrypt(this.email);
    }
    if (this.phone) {
      this.phone = this.encryptionService.decrypt(this.phone);
    }
  }
}
