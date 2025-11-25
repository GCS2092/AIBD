import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  private readonly ivLength = 16;
  private readonly saltLength = 64;
  private readonly tagLength = 16;

  constructor(private configService: ConfigService) {
    // Récupérer la clé de chiffrement depuis les variables d'environnement
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY must be set in environment variables');
    }

    // Créer une clé de 32 bytes (256 bits) à partir de la clé fournie
    this.key = crypto.scryptSync(encryptionKey, 'salt', 32);
  }

  /**
   * Chiffre une valeur en utilisant AES-256-GCM
   */
  encrypt(text: string): string {
    if (!text) {
      return text;
    }

    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      // Format: iv:tag:encrypted
      return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Déchiffre une valeur chiffrée
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) {
      return encryptedText;
    }

    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        // Si le format n'est pas correct, retourner tel quel (pour compatibilité avec données non chiffrées)
        return encryptedText;
      }

      const [ivHex, tagHex, encrypted] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      // Si le déchiffrement échoue, retourner tel quel (pour compatibilité)
      console.warn(`Decryption failed for value, returning as-is: ${error.message}`);
      return encryptedText;
    }
  }

  /**
   * Hash une valeur (pour recherche sans déchiffrer)
   * Utilisé pour les recherches d'email/phone
   */
  hashForSearch(value: string): string {
    if (!value) {
      return value;
    }
    return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
  }
}

