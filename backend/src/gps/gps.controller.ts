import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { GpsService } from './gps.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('gps')
export class GpsController {
  constructor(private readonly gpsService: GpsService) {}

  @Post('rides/:id/location')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  async updateDriverLocation(
    @CurrentUser() user: any,
    @Param('id') rideId: string,
    @Body() locationDto: UpdateLocationDto,
  ) {
    return this.gpsService.updateDriverLocation(rideId, locationDto);
  }

  @Get('rides/:id/location')
  async getDriverLocation(@Param('id') rideId: string) {
    return this.gpsService.getDriverLocation(rideId);
  }

  @Get('rides/:id/eta')
  async getEstimatedTime(@Param('id') rideId: string) {
    const timeInMinutes = await this.gpsService.getEstimatedTime(rideId);
    return {
      estimatedTimeMinutes: timeInMinutes,
      estimatedTimeFormatted: timeInMinutes
        ? `${timeInMinutes} minutes`
        : 'Non disponible',
    };
  }
}

