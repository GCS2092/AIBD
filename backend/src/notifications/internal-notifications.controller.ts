import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InternalNotificationsService } from './internal-notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class InternalNotificationsController {
  constructor(
    private readonly notificationsService: InternalNotificationsService,
  ) {}

  @Get()
  async getMyNotifications(
    @CurrentUser() user: any,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const notifications = await this.notificationsService.getUserNotifications(
      user.id,
      unreadOnly === 'true',
    );

    return notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      rideId: n.rideId,
      createdAt: n.createdAt,
      metadata: n.metadata,
    }));
  }

  @Get('unread/count')
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // 60 requêtes par minute pour cette route
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    await this.notificationsService.markAsRead(id, user.id);
    return { success: true };
  }
}

