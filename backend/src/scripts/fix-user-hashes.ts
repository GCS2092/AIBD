import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { User } from '../entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EncryptionService } from '../encryption/encryption.service';
import * as crypto from 'crypto';

async function fixUserHashes() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    
    const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    const encryptionService = app.get<EncryptionService>(EncryptionService);

    const hashForSearch = (value: string): string => {
      return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
    };

    // Récupérer tous les utilisateurs
    const users = await userRepository.find();

    console.log(`\n📋 ${users.length} utilisateurs trouvés\n`);

    let updated = 0;
    for (const user of users) {
      // Injecter le service pour déchiffrer
      user.setEncryptionService(encryptionService);
      
      // Recharger l'utilisateur pour déclencher AfterLoad (déchiffrement)
      const reloadedUser = await userRepository.findOne({
        where: { id: user.id },
      });
      
      if (!reloadedUser) continue;
      
      reloadedUser.setEncryptionService(encryptionService);
      
      // L'email et le téléphone seront déchiffrés par AfterLoad
      // Mais AfterLoad ne s'exécute que lors du chargement depuis la DB
      // On doit donc déchiffrer manuellement
      let decryptedEmail = reloadedUser.email;
      let decryptedPhone = reloadedUser.phone;
      
      // Si l'email contient ":" c'est probablement chiffré
      if (decryptedEmail && decryptedEmail.includes(':')) {
        try {
          decryptedEmail = encryptionService.decrypt(decryptedEmail);
        } catch (e) {
          console.warn(`Impossible de déchiffrer l'email pour ${user.id}`);
        }
      }
      
      if (decryptedPhone && decryptedPhone.includes(':')) {
        try {
          decryptedPhone = encryptionService.decrypt(decryptedPhone);
        } catch (e) {
          // Ignorer
        }
      }
      
      // Calculer les hashs sur les valeurs EN CLAIR
      const emailHash = hashForSearch(decryptedEmail);
      const phoneHash = decryptedPhone ? hashForSearch(decryptedPhone) : undefined;

      let needsUpdate = false;

      if (!reloadedUser.emailHash || reloadedUser.emailHash !== emailHash) {
        needsUpdate = true;
        console.log(`✅ Email hash pour ${decryptedEmail}`);
      }

      if (decryptedPhone && (!reloadedUser.phoneHash || reloadedUser.phoneHash !== phoneHash)) {
        needsUpdate = true;
        console.log(`✅ Phone hash pour ${decryptedEmail}`);
      }

      if (needsUpdate) {
        // Mettre à jour uniquement les hashs (sans re-chiffrer)
        await userRepository.update(reloadedUser.id, {
          emailHash: emailHash,
          phoneHash: phoneHash,
        });
        updated++;
      }
    }

    console.log(`\n✅ ${updated} utilisateurs mis à jour\n`);

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixUserHashes();

