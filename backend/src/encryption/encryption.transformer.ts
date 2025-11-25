import { ValueTransformer } from 'typeorm';
import { EncryptionService } from './encryption.service';

/**
 * Transformer TypeORM pour chiffrer/déchiffrer automatiquement les données
 */
export class EncryptionTransformer implements ValueTransformer {
  constructor(private encryptionService: EncryptionService) {}

  to(value: string | null): string | null {
    if (value === null || value === undefined) {
      return value;
    }
    return this.encryptionService.encrypt(value);
  }

  from(value: string | null): string | null {
    if (value === null || value === undefined) {
      return value;
    }
    return this.encryptionService.decrypt(value);
  }
}

