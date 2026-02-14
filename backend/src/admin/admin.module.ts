import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../entities/user.entity';
import { Driver } from '../entities/driver.entity';
import { Ride } from '../entities/ride.entity';
import { Pricing } from '../entities/pricing.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { InternalNotification } from '../entities/internal-notification.entity';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Driver, Ride, Pricing, Vehicle, InternalNotification]),
    EncryptionModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

