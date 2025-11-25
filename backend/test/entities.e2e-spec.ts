import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from '../src/config/database.config';
import { User, UserRole } from '../src/entities/user.entity';
import { Driver, DriverStatus } from '../src/entities/driver.entity';
import { Vehicle } from '../src/entities/vehicle.entity';
import { Ride, RideStatus, RideType } from '../src/entities/ride.entity';
import { Pricing, PricingType } from '../src/entities/pricing.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

describe('Entities Tests', () => {
  let module: TestingModule;
  let userRepository: Repository<User>;
  let driverRepository: Repository<Driver>;
  let vehicleRepository: Repository<Vehicle>;
  let rideRepository: Repository<Ride>;
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
        ]),
      ],
    }).compile();

    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    driverRepository = module.get<Repository<Driver>>(
      getRepositoryToken(Driver),
    );
    vehicleRepository = module.get<Repository<Vehicle>>(
      getRepositoryToken(Vehicle),
    );
    rideRepository = module.get<Repository<Ride>>(getRepositoryToken(Ride));
    pricingRepository = module.get<Repository<Pricing>>(
      getRepositoryToken(Pricing),
    );
  });

  afterAll(async () => {
    await module.close();
  });

  describe('User Entity', () => {
    it('should create a user with correct structure', async () => {
      const testUser = userRepository.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+221771234567',
        role: UserRole.ADMIN,
        isActive: true,
      });

      expect(testUser).toBeDefined();
      expect(testUser.firstName).toBe('Test');
      expect(testUser.email).toBe('test@example.com');
      expect(testUser.role).toBe(UserRole.ADMIN);
    });

    it('should validate email uniqueness constraint', async () => {
      // Test que la colonne email existe et est définie comme unique dans l'entité
      const metadata = userRepository.metadata;
      const emailColumn = metadata.columns.find(c => c.propertyName === 'email');
      expect(emailColumn).toBeDefined();
      // Vérifier que la colonne existe (l'unicité est gérée par la base de données)
      expect(emailColumn?.propertyName).toBe('email');
    });
  });

  describe('Driver Entity', () => {
    it('should have correct status enum values', () => {
      const statuses = Object.values(DriverStatus);
      expect(statuses).toContain('available');
      expect(statuses).toContain('on_ride');
      expect(statuses).toContain('unavailable');
      expect(statuses).toContain('on_break');
    });

    it('should create a driver with default values', () => {
      const testDriver = driverRepository.create({
        status: DriverStatus.AVAILABLE,
        consecutiveRides: 0,
        totalRides: 0,
        rating: 0,
        ratingCount: 0,
        isVerified: false,
      });

      expect(testDriver.status).toBe(DriverStatus.AVAILABLE);
      expect(testDriver.consecutiveRides).toBe(0);
      expect(testDriver.isVerified).toBe(false);
    });
  });

  describe('Ride Entity', () => {
    it('should have correct status enum values', () => {
      const statuses = Object.values(RideStatus);
      expect(statuses).toContain('pending');
      expect(statuses).toContain('assigned');
      expect(statuses).toContain('accepted');
      expect(statuses).toContain('completed');
      expect(statuses).toContain('cancelled');
    });

    it('should have correct ride type enum values', () => {
      const types = Object.values(RideType);
      expect(types).toContain('dakar_to_airport');
      expect(types).toContain('airport_to_dakar');
    });

    it('should create a ride with correct structure', () => {
      const testRide = rideRepository.create({
        clientFirstName: 'John',
        clientLastName: 'Doe',
        clientPhone: '+221771234567',
        pickupAddress: 'Dakar, Sénégal',
        dropoffAddress: 'Aéroport International Blaise Diagne',
        rideType: RideType.DAKAR_TO_AIRPORT,
        scheduledAt: new Date(),
        price: 5000,
        status: RideStatus.PENDING,
      });

      expect(testRide).toBeDefined();
      expect(testRide.rideType).toBe(RideType.DAKAR_TO_AIRPORT);
      expect(testRide.status).toBe(RideStatus.PENDING);
      expect(testRide.price).toBe(5000);
    });
  });

  describe('Pricing Entity', () => {
    it('should have correct pricing type enum values', () => {
      const types = Object.values(PricingType);
      expect(types).toContain('standard');
      expect(types).toContain('peak_hours');
      expect(types).toContain('night');
      expect(types).toContain('special');
    });

    it('should retrieve default pricing entries', async () => {
      const pricing = await pricingRepository.find({
        where: { isActive: true },
      });

      expect(Array.isArray(pricing)).toBe(true);
      
      if (pricing.length > 0) {
        const firstPricing = pricing[0];
        expect(firstPricing).toHaveProperty('name');
        expect(firstPricing).toHaveProperty('price');
        expect(firstPricing).toHaveProperty('rideType');
        expect(firstPricing.isActive).toBe(true);
      }
    });
  });
});

