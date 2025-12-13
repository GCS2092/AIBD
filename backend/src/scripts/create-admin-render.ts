import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { User, UserRole } from '../entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { EncryptionService } from '../encryption/encryption.service';

async function createAdmin() {
  try {
    console.log('🚀 Démarrage de la création de l\'admin...');
    
    const app = await NestFactory.createApplicationContext(AppModule);
    
    const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    const encryptionService = app.get<EncryptionService>(EncryptionService);

    const adminEmail = 'bakalafoua2020@gmail.com';
    const adminPassword = '04Mars98';
    
    const hashForSearch = (value: string): string => {
      return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
    };

    const emailHash = hashForSearch(adminEmail);
    
    console.log('🔍 Vérification si l\'admin existe déjà...');
    // Vérifier si l'admin existe déjà (via hash)
    const existingAdmin = await userRepository.findOne({
      where: { emailHash },
    });

    if (existingAdmin) {
      console.log('✅ Admin existe déjà:', adminEmail);
      // Vérifier si c'est déjà un admin
      if (existingAdmin.role === UserRole.ADMIN) {
        console.log('ℹ️  Cet utilisateur est déjà un admin.');
      } else {
        console.log('⚠️  Cet utilisateur existe mais n\'est pas admin. Mise à jour du rôle...');
        existingAdmin.role = UserRole.ADMIN;
        existingAdmin.isActive = true;
        await userRepository.save(existingAdmin);
        console.log('✅ Rôle admin ajouté avec succès!');
      }
      await app.close();
      return;
    }

    console.log('🔐 Hashage du mot de passe...');
    // Créer l'admin
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    console.log('👤 Création de l\'utilisateur admin...');
    const admin = userRepository.create({
      firstName: 'Admin',
      lastName: 'Bakalafoua',
      email: adminEmail,
      phone: '+221000000000', // Numéro par défaut, peut être modifié plus tard
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    });
    
    // Injecter le service d'encryption (va chiffrer et générer les hashs)
    admin.setEncryptionService(encryptionService);
    
    console.log('💾 Sauvegarde dans la base de données...');
    await userRepository.save(admin);

    console.log('\n✅ Admin créé avec succès!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Mot de passe:', adminPassword);
    console.log('👤 Rôle: ADMIN');
    console.log('⚠️  Changez le mot de passe après la première connexion!\n');

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

createAdmin();

