import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { getDatabaseConfig } from './config/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Entities
import { User } from './entities/user.entity';
import { Driver } from './entities/driver.entity';
import { Vehicle } from './entities/vehicle.entity';
import { Ride } from './entities/ride.entity';
import { Pricing } from './entities/pricing.entity';
import { Notification } from './entities/notification.entity';
import { InternalNotification } from './entities/internal-notification.entity';
import { Cancellation } from './entities/cancellation.entity';
import { Config } from './entities/config.entity';
import { RideAssignment } from './entities/ride-assignment.entity';
import { FcmToken } from './entities/fcm-token.entity';

// Modules
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { DriverModule } from './driver/driver.module';
import { RideModule } from './ride/ride.module';
import { PricingModule } from './pricing/pricing.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EncryptionModule } from './encryption/encryption.module';
import { EncryptionInterceptor } from './encryption/encryption.interceptor';
import { RatingsModule } from './ratings/ratings.module';
import { GpsModule } from './gps/gps.module';
import { RefundsModule } from './refunds/refunds.module';
import { ConfigSystemModule } from './config-system/config-system.module';
import { WebSocketModule } from './websocket/websocket.module';
import { FirebaseModule } from './firebase/firebase.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    FirebaseModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 30, // 30 requêtes par minute (augmenté pour éviter les erreurs 429)
      },
    ]),
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
      InternalNotification,
      Cancellation,
      Config,
      FcmToken,
    ]),
    EncryptionModule,
    AuthModule,
    AdminModule,
    DriverModule,
    RideModule,
    PricingModule,
    NotificationsModule,
    RatingsModule,
    GpsModule,
    RefundsModule,
    ConfigSystemModule,
    WebSocketModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: EncryptionInterceptor,
    },
  ],
})
export class AppModule {}
