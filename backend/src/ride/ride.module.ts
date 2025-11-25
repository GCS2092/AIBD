import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RideService } from './ride.service';
import { RideController } from './ride.controller';
import { Ride } from '../entities/ride.entity';
import { Driver } from '../entities/driver.entity';
import { Pricing } from '../entities/pricing.entity';
import { User } from '../entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConfigSystemModule } from '../config-system/config-system.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ride, Driver, Pricing, User]),
    NotificationsModule,
    ConfigSystemModule,
    EncryptionModule,
    forwardRef(() => WebSocketModule),
  ],
  controllers: [RideController],
  providers: [RideService],
  exports: [RideService],
})
export class RideModule {}

