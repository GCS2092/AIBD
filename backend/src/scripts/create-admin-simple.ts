import { DataSource } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as path from 'path';

// Service d'encryption simplifié
class SimpleEncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY must be set');
    }
    this.key = crypto.scryptSync(encryptionKey, 'salt', 32);
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv) as crypto.CipherGCM;
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  hashForSearch(value: string): string {
    return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
  }
}

async function createAdmin() {
  const encryptionService = new SimpleEncryptionService();
  const isProduction = process.env.NODE_ENV === 'production';
  const host = process.env.DB_HOST || 'localhost';
  const dbSsl = process.env.DB_SSL;
  const useSsl = dbSsl === 'true' || (isProduction && host !== 'localhost' && host !== '127.0.0.1');

  const dataSource = new DataSource({
    type: 'postgres',
    host: host,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'AIBD',
    // Charger toutes les entités automatiquement pour éviter les erreurs de relations
    entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
    ...(useSsl && {
      ssl: {
        rejectUnauthorized: false,
      },
    }),
  });

  try {
    await dataSource.initialize();
    console.log('✅ Connexion à la base de données réussie');

    const userRepository = dataSource.getRepository(User);

    const adminEmail = 'bakalafoua2020@gmail.com';
    const adminPassword = '04Mars98';
    
    const emailHash = encryptionService.hashForSearch(adminEmail);
    
    console.log('🔍 Vérification si l\'admin existe déjà...');
    const existingAdmin = await userRepository.findOne({
      where: { emailHash },
    });

    if (existingAdmin) {
      console.log('✅ Admin existe déjà:', adminEmail);
      if (existingAdmin.role === UserRole.ADMIN) {
        console.log('ℹ️  Cet utilisateur est déjà un admin.');
      } else {
        console.log('⚠️  Mise à jour du rôle en admin...');
        existingAdmin.role = UserRole.ADMIN;
        existingAdmin.isActive = true;
        await userRepository.save(existingAdmin);
        console.log('✅ Rôle admin ajouté avec succès!');
      }
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    return;
    }

    console.log('🔐 Hashage du mot de passe...');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    console.log('👤 Création de l\'utilisateur admin...');
    const encryptedEmail = encryptionService.encrypt(adminEmail);
    const encryptedPhone = encryptionService.encrypt('+221000000000');
    const phoneHash = encryptionService.hashForSearch('+221000000000');

    const admin = userRepository.create({
      firstName: 'Admin',
      lastName: 'Bakalafoua',
      email: encryptedEmail,
      emailHash,
      phone: encryptedPhone,
      phoneHash,
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    });

    console.log('💾 Sauvegarde dans la base de données...');
    await userRepository.save(admin);

    console.log('\n✅ Admin créé avec succès!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Mot de passe:', adminPassword);
    console.log('👤 Rôle: ADMIN');
    console.log('⚠️  Changez le mot de passe après la première connexion!\n');

    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

createAdmin();

