import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { User, UserRole } from '../entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EncryptionService } from '../encryption/encryption.service';
import * as crypto from 'crypto';

async function checkAdmin() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    
    const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    const encryptionService = app.get<EncryptionService>(EncryptionService);

    const adminEmail = 'bakalafoua2020@gmail.com';
    
    const hashForSearch = (value: string): string => {
      return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
    };

    const emailHash = hashForSearch(adminEmail);
    
    // Chercher l'utilisateur par hash
    const user = await userRepository.findOne({
      where: { emailHash },
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé:', adminEmail);
      await app.close();
      process.exit(1);
    }

    // Injecter le service d'encryption pour déchiffrer
    user.setEncryptionService(encryptionService);
    
    // Recharger pour déclencher le déchiffrement
    const reloadedUser = await userRepository.findOne({
      where: { id: user.id },
    });
    if (reloadedUser) {
      reloadedUser.setEncryptionService(encryptionService);
      
      console.log('✅ Utilisateur trouvé!');
      console.log('📧 Email:', reloadedUser.email);
      console.log('👤 Nom:', reloadedUser.firstName, reloadedUser.lastName);
      console.log('🔑 Rôle:', reloadedUser.role);
      console.log('✅ Actif:', reloadedUser.isActive ? 'Oui' : 'Non');
      console.log('📅 Créé le:', reloadedUser.createdAt);
      
      if (reloadedUser.role === UserRole.ADMIN) {
        console.log('\n✅ Cet utilisateur est bien un ADMIN!');
      } else {
        console.log('\n⚠️  Cet utilisateur n\'est PAS un admin (rôle:', reloadedUser.role, ')');
      }
    } else {
      console.log('❌ Erreur lors du rechargement de l\'utilisateur');
    }

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkAdmin();

