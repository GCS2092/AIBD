import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
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

  @Post('fcm/register')
  async registerFcmToken(
    @CurrentUser() user: any,
    @Body() body: { token?: string; deviceLabel?: string },
  ) {
    return this.doRegisterFcmToken(user.id, body);
  }

  /** Alias pour compatibilité (ancienne URL). */
  @Post('register-fcm-token')
  async registerFcmTokenLegacy(
    @CurrentUser() user: any,
    @Body() body: { token?: string; deviceLabel?: string },
  ) {
    return this.doRegisterFcmToken(user.id, body);
  }

  private doRegisterFcmToken(
    userId: string,
    body: { token?: string; deviceLabel?: string },
  ) {
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    if (!token || token.length > 500) {
      throw new BadRequestException('Token FCM invalide ou manquant (max 500 caractères)');
    }
    const deviceLabel = typeof body?.deviceLabel === 'string'
      ? body.deviceLabel.slice(0, 100).trim()
      : undefined;
    return this.notificationsService.registerFcmToken(
      userId,
      token,
      deviceLabel || undefined,
    );
  }

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

