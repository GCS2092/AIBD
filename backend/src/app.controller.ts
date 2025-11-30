import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Driver } from './entities/driver.entity';
import { Ride } from './entities/ride.entity';
import { Pricing } from './entities/pricing.entity';
import { NotificationService } from './notifications/notification.service';

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
    private readonly notificationService: NotificationService,
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
        const users = await this.userRepository.find({ take: 5 });
        results.tables.users = { 
          status: 'ok', 
          count: userCount,
          sample: users.map(u => ({ id: u.id, email: u.email, role: u.role }))
        };
      } catch (error: any) {
        results.tables.users = { 
          status: 'error', 
          error: error.message,
          code: error.code,
          hint: error.hint || 'Table users may not exist. Run migrations or set NODE_ENV=development to auto-create tables.'
        };
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
        message: results.errors.length > 0 
          ? 'Some tables have errors. Check errors array for details.' 
          : 'All tables are accessible.',
      };
    } catch (error: any) {
      return {
        success: false,
        database: 'error',
        error: error.message,
        code: error.code,
        hint: error.hint || 'Database connection or table creation issue. Check if tables exist.',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }
  }

  @Post('test/push-notification')
  async testPushNotification(@Body() body: { token: string; title?: string; message?: string }) {
    try {
      const { token, title = 'Test Notification', message = 'Ceci est une notification de test depuis le backend AIBD !' } = body;

      if (!token) {
        return {
          success: false,
          error: 'Token FCM requis. Fournissez un token dans le body: { "token": "votre-token-fcm" }',
        };
      }

      // Utiliser la méthode privée via une méthode publique ou créer une méthode de test
      // Pour l'instant, on va utiliser sendPushNotificationToMultiple avec un seul token
      await this.notificationService.sendPushNotificationToMultiple(
        [token],
        title,
        message,
      );

      return {
        success: true,
        message: 'Notification push envoyée avec succès !',
        token: token.substring(0, 20) + '...', // Afficher seulement les 20 premiers caractères
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        code: error.code,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }
  }
}
