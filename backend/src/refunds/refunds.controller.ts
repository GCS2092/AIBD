import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RefundsService } from './refunds.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { CancellationType } from '../entities/cancellation.entity';

@Controller('refunds')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post('rides/:id/process')
  async processRefund(
    @Param('id') rideId: string,
    @Body('cancellationType') cancellationType: CancellationType,
    @Body('reason') reason: string,
  ) {
    return this.refundsService.processRefund(rideId, cancellationType, reason);
  }

  @Get('rides/:id/status')
  async getRefundStatus(@Param('id') rideId: string) {
    return this.refundsService.getRefundStatus(rideId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllRefunds(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('refunded') refunded?: string,
  ) {
    return this.refundsService.getAllRefunds({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      refunded: refunded === 'true' ? true : refunded === 'false' ? false : undefined,
    });
  }
}

