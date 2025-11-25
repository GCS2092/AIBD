import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { Driver } from '../entities/driver.entity';
import { Ride } from '../entities/ride.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { User } from '../entities/user.entity';
import { RideAssignment } from '../entities/ride-assignment.entity';
import { ConfigSystemModule } from '../config-system/config-system.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Driver, Ride, Vehicle, User, RideAssignment]),
    ConfigSystemModule,
    NotificationsModule,
    EncryptionModule,
    forwardRef(() => WebSocketModule),
  ],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService],
})
export class DriverModule {}

