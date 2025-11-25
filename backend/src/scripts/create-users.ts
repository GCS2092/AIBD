import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { User } from '../entities/user.entity';
import { Driver } from '../entities/driver.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserRole } from '../entities/user.entity';
import { EncryptionService } from '../encryption/encryption.service';

async function createUsers() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    
    const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    const driverRepository = app.get<Repository<Driver>>(getRepositoryToken(Driver));
    const encryptionService = app.get<EncryptionService>(EncryptionService);

    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const hashForSearch = (value: string): string => {
      return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
    };

    // Créer 3 admins
    const admins: User[] = [];
    for (let i = 1; i <= 3; i++) {
      const email = `admin${i}@aibd.sn`;
      const emailHash = hashForSearch(email);
      
      // Chercher par hash au lieu de email (car email est chiffré)
      const existingAdmin = await userRepository.findOne({
        where: { emailHash },
      });

      if (!existingAdmin) {
        const admin = userRepository.create({
          firstName: `Admin${i}`,
          lastName: 'AIBD',
          email: email,
          phone: `+22177123456${i}`,
          password: hashedPassword,
          role: UserRole.ADMIN,
          isActive: true,
        });
        
        // Injecter le service d'encryption (va chiffrer et générer les hashs)
        admin.setEncryptionService(encryptionService);
        
        await userRepository.save(admin);
        admins.push(admin);
        console.log(`✅ Admin ${i} créé: ${email}`);
      } else {
        console.log(`ℹ️  Admin ${i} existe déjà: ${email}`);
      }
    }

    // Créer 3 drivers
    const drivers: Array<{ user: User; driver: Driver }> = [];
    for (let i = 1; i <= 3; i++) {
      const email = `driver${i}@aibd.sn`;
      const emailHash = hashForSearch(email);
      
      // Chercher par hash au lieu de email
      const existingUser = await userRepository.findOne({
        where: { emailHash },
      });

      if (!existingUser) {
        const user = userRepository.create({
          firstName: `Chauffeur${i}`,
          lastName: 'AIBD',
          email: email,
          phone: `+22177234567${i}`,
          password: hashedPassword,
          role: UserRole.DRIVER,
          isActive: true,
        });
        
        // Injecter le service d'encryption
        user.setEncryptionService(encryptionService);
        
        const savedUser = await userRepository.save(user);

        const driver = driverRepository.create({
          userId: savedUser.id,
          licenseNumber: `LIC${i.toString().padStart(6, '0')}`,
          status: 'unavailable' as any,
          isVerified: true,
          totalRides: 0,
          consecutiveRides: 0,
          rating: 0,
          ratingCount: 0,
        });
        driver.user = savedUser;
        await driverRepository.save(driver);
        drivers.push({ user: savedUser, driver });
        console.log(`✅ Chauffeur ${i} créé: driver${i}@aibd.sn`);
      } else {
        console.log(`ℹ️  Chauffeur ${i} existe déjà: driver${i}@aibd.sn`);
      }
    }

    console.log('\n📊 Résumé:');
    console.log(`- Admins: ${admins.length} créés`);
    console.log(`- Chauffeurs: ${drivers.length} créés`);
    console.log('\n🔑 Mot de passe pour tous: password123');

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createUsers();
