import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Driver } from './entities/driver.entity';
import { Ride } from './entities/ride.entity';
import { Pricing } from './entities/pricing.entity';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Ride)
    private readonly rideRepository: Repository<Ride>,
    @InjectRepository(Pricing)
    private readonly pricingRepository: Repository<Pricing>,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('test/database')
  async testDatabase() {
    try {
      // Test de connexion et requêtes sur chaque table
      const results = {
        database: 'connected',
        tables: {} as Record<string, any>,
        errors: [] as string[],
      };

      // Test Users
      try {
        const userCount = await this.userRepository.count();
        results.tables.users = { status: 'ok', count: userCount };
      } catch (error) {
        results.tables.users = { status: 'error', error: error.message };
        results.errors.push(`Users table: ${error.message}`);
      }

      // Test Drivers
      try {
        const driverCount = await this.driverRepository.count();
        results.tables.drivers = { status: 'ok', count: driverCount };
      } catch (error) {
        results.tables.drivers = { status: 'error', error: error.message };
        results.errors.push(`Drivers table: ${error.message}`);
      }

      // Test Rides
      try {
        const rideCount = await this.rideRepository.count();
        results.tables.rides = { status: 'ok', count: rideCount };
      } catch (error) {
        results.tables.rides = { status: 'error', error: error.message };
        results.errors.push(`Rides table: ${error.message}`);
      }

      // Test Pricing
      try {
        const pricingCount = await this.pricingRepository.count();
        const pricingList = await this.pricingRepository.find({
          where: { isActive: true },
        });
        results.tables.pricing = {
          status: 'ok',
          count: pricingCount,
          active: pricingList.length,
          items: pricingList.map((p) => ({
            name: p.name,
            price: p.price,
            type: p.type,
          })),
        };
      } catch (error) {
        results.tables.pricing = { status: 'error', error: error.message };
        results.errors.push(`Pricing table: ${error.message}`);
      }

      // Test de requête complexe (JOIN)
      try {
        const testJoin = await this.userRepository
          .createQueryBuilder('user')
          .leftJoinAndSelect('user.driver', 'driver')
          .limit(1)
          .getOne();
        results.tables.relations = {
          status: 'ok',
          testJoin: testJoin ? 'success' : 'no_data',
        };
      } catch (error) {
        results.tables.relations = { status: 'error', error: error.message };
        results.errors.push(`Relations test: ${error.message}`);
      }

      return {
        success: results.errors.length === 0,
        ...results,
      };
    } catch (error) {
      return {
        success: false,
        database: 'error',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }
  }
}
