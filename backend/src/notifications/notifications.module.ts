import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { InternalNotificationsService } from './internal-notifications.service';
import { InternalNotificationsController } from './internal-notifications.controller';
import { Notification } from '../entities/notification.entity';
import { InternalNotification } from '../entities/internal-notification.entity';
import { Driver } from '../entities/driver.entity';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, InternalNotification, Driver]),
    forwardRef(() => WebSocketModule),
  ],
  controllers: [InternalNotificationsController],
  providers: [NotificationService, InternalNotificationsService],
  exports: [NotificationService, InternalNotificationsService],
})
export class NotificationsModule {}

