import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { InternalNotificationsService } from './internal-notifications.service';
import { OneSignalService } from './onesignal.service';
import { InternalNotificationsController } from './internal-notifications.controller';
import { Notification } from '../entities/notification.entity';
import { InternalNotification } from '../entities/internal-notification.entity';
import { FcmToken } from '../entities/fcm-token.entity';
import { Driver } from '../entities/driver.entity';
import { WebSocketModule } from '../websocket/websocket.module';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, InternalNotification, FcmToken, Driver]),
    forwardRef(() => WebSocketModule),
    FirebaseModule,
  ],
  controllers: [InternalNotificationsController],
  providers: [NotificationService, InternalNotificationsService, OneSignalService],
  exports: [NotificationService, InternalNotificationsService, OneSignalService],
})
export class NotificationsModule {}

