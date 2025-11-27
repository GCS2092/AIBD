import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RideService } from './ride.service';
import { RideController } from './ride.controller';
import { Ride } from '../entities/ride.entity';
import { Driver } from '../entities/driver.entity';
import { Pricing } from '../entities/pricing.entity';
import { User } from '../entities/user.entity';
import { RideAssignment } from '../entities/ride-assignment.entity';
import { RideAssignmentService } from './ride-assignment.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConfigSystemModule } from '../config-system/config-system.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { GeocodingModule } from '../geocoding/geocoding.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ride, Driver, Pricing, User, RideAssignment]),
    NotificationsModule,
    ConfigSystemModule,
    EncryptionModule,
    GeocodingModule,
    forwardRef(() => WebSocketModule),
  ],
  controllers: [RideController],
  providers: [RideService, RideAssignmentService],
  exports: [RideService, RideAssignmentService],
})
export class RideModule {}

