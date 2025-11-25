import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from '../src/config/database.config';
import { User } from '../src/entities/user.entity';
import { Driver } from '../src/entities/driver.entity';
import { Vehicle } from '../src/entities/vehicle.entity';
import { Ride } from '../src/entities/ride.entity';
import { Pricing } from '../src/entities/pricing.entity';
import { Notification } from '../src/entities/notification.entity';
import { Cancellation } from '../src/entities/cancellation.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Database Connection Tests', () => {
  let module: TestingModule;
  let userRepository: Repository<User>;
  let driverRepository: Repository<Driver>;
  let pricingRepository: Repository<Pricing>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: getDatabaseConfig,
          inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([
          User,
          Driver,
          Vehicle,
          Ride,
          Pricing,
          Notification,
          Cancellation,
        ]),
      ],
    }).compile();

    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    driverRepository = module.get<Repository<Driver>>(
      getRepositoryToken(Driver),
    );
    pricingRepository = module.get<Repository<Pricing>>(
      getRepositoryToken(Pricing),
    );
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Database Connection', () => {
    it('should connect to PostgreSQL database', async () => {
      expect(userRepository).toBeDefined();
      expect(driverRepository).toBeDefined();
      expect(pricingRepository).toBeDefined();
    });

    it('should be able to query users table', async () => {
      const count = await userRepository.count();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should be able to query drivers table', async () => {
      const count = await driverRepository.count();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should be able to query pricing table', async () => {
      const count = await pricingRepository.count();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should have default pricing entries', async () => {
      const pricing = await pricingRepository.find({
        where: { isActive: true },
      });
      expect(pricing).toBeDefined();
      expect(Array.isArray(pricing)).toBe(true);
    });
  });

  describe('Database Schema', () => {
    it('should have users table with correct structure', async () => {
      const metadata = userRepository.metadata;
      expect(metadata).toBeDefined();
      expect(metadata.tableName).toBe('users');
      expect(metadata.columns.find((c) => c.propertyName === 'email')).toBeDefined();
      expect(metadata.columns.find((c) => c.propertyName === 'role')).toBeDefined();
    });

    it('should have drivers table with correct structure', async () => {
      const metadata = driverRepository.metadata;
      expect(metadata).toBeDefined();
      expect(metadata.tableName).toBe('drivers');
      expect(metadata.columns.find((c) => c.propertyName === 'status')).toBeDefined();
      expect(metadata.columns.find((c) => c.propertyName === 'userId')).toBeDefined();
    });

    it('should have pricing table with correct structure', async () => {
      const metadata = pricingRepository.metadata;
      expect(metadata).toBeDefined();
      expect(metadata.tableName).toBe('pricing');
      expect(metadata.columns.find((c) => c.propertyName === 'price')).toBeDefined();
      expect(metadata.columns.find((c) => c.propertyName === 'rideType')).toBeDefined();
    });
  });

  describe('Database Relations', () => {
    it('should support User-Driver relation', async () => {
      // Test que la relation est définie dans le schéma
      const metadata = userRepository.metadata;
      const driverRelation = metadata.relations.find(r => r.propertyName === 'driver');
      expect(driverRelation).toBeDefined();
      expect(driverRelation?.relationType).toBe('one-to-one');
    });
  });
});

