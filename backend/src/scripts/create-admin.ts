import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { User, UserRole } from '../entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@aibd.sn';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  // Vérifier si l'admin existe déjà
  const existingAdmin = await userRepository.findOne({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('✅ Admin existe déjà:', adminEmail);
    await app.close();
    return;
  }

  // Créer l'admin
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const admin = userRepository.create({
    firstName: 'Admin',
    lastName: 'AIBD',
    email: adminEmail,
    password: hashedPassword,
    phone: '+221771234567',
    role: UserRole.ADMIN,
    isActive: true,
  });

  await userRepository.save(admin);

  console.log('✅ Admin créé avec succès!');
  console.log('📧 Email:', adminEmail);
  console.log('🔑 Mot de passe:', adminPassword);
  console.log('⚠️  Changez le mot de passe après la première connexion!');

  await app.close();
}

bootstrap();

