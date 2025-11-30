import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import { config } from 'dotenv';
import * as path from 'path';

// Charger les variables d'environnement
config({ path: path.join(__dirname, '../../.env') });

// Import des entités
import { User, UserRole } from '../entities/user.entity';
import { Driver } from '../entities/driver.entity';

// Service d'encryption simplifié
class SimpleEncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY must be set');
    }
    // Utiliser la même méthode que EncryptionService (scryptSync)
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

async function createUsers() {
  const encryptionService = new SimpleEncryptionService();
  const password = 'password';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Configuration de la base de données
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'AIBD',
    entities: [User, Driver],
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await dataSource.initialize();
    console.log('✅ Connexion à la base de données réussie');

    const userRepository = dataSource.getRepository(User);
    const driverRepository = dataSource.getRepository(Driver);

    // Créer 3 admins
    const admins: User[] = [];
    for (let i = 1; i <= 3; i++) {
      const email = `admin${i}@aibd.sn`;
      const emailHash = encryptionService.hashForSearch(email);
      
      const existingAdmin = await userRepository.findOne({
        where: { emailHash },
      });

      if (!existingAdmin) {
        const encryptedEmail = encryptionService.encrypt(email);
        const encryptedPhone = encryptionService.encrypt(`+22177123456${i}`);
        const phoneHash = encryptionService.hashForSearch(`+22177123456${i}`);

        const admin = userRepository.create({
          firstName: `Admin${i}`,
          lastName: 'AIBD',
          email: encryptedEmail,
          emailHash,
          phone: encryptedPhone,
          phoneHash,
          password: hashedPassword,
          role: UserRole.ADMIN,
          isActive: true,
        });

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
      const emailHash = encryptionService.hashForSearch(email);
      
      const existingUser = await userRepository.findOne({
        where: { emailHash },
      });

      if (!existingUser) {
        const encryptedEmail = encryptionService.encrypt(email);
        const encryptedPhone = encryptionService.encrypt(`+22177234567${i}`);
        const phoneHash = encryptionService.hashForSearch(`+22177234567${i}`);

        const user = userRepository.create({
          firstName: `Chauffeur${i}`,
          lastName: 'AIBD',
          email: encryptedEmail,
          emailHash,
          phone: encryptedPhone,
          phoneHash,
          password: hashedPassword,
          role: UserRole.DRIVER,
          isActive: true,
        });

        const savedUser = await userRepository.save(user);

        const encryptedLicense = encryptionService.encrypt(`LIC${i.toString().padStart(6, '0')}`);

        const driver = driverRepository.create({
          userId: savedUser.id,
          licenseNumber: encryptedLicense,
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
        console.log(`✅ Chauffeur ${i} créé: ${email}`);
      } else {
        console.log(`ℹ️  Chauffeur ${i} existe déjà: ${email}`);
      }
    }

    console.log('\n📊 Résumé:');
    console.log(`- Admins: ${admins.length} créés`);
    console.log(`- Chauffeurs: ${drivers.length} créés`);
    console.log('\n🔑 Mot de passe pour tous: password');

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

createUsers();

