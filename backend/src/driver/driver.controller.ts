import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DriverService } from './driver.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../entities/user.entity';
import { DriverStatus } from '../entities/driver.entity';
import { RideStatus } from '../entities/ride.entity';
import { RequestProfileUpdateDto } from './dto/request-profile-update.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Controller('driver')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DRIVER)
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Get('profile')
  async getMyProfile(@CurrentUser() user: any) {
    return this.driverService.getMyProfile(user.id);
  }

  @Put('status')
  async updateStatus(
    @CurrentUser() user: any,
    @Body('status') status: DriverStatus,
  ) {
    return this.driverService.updateStatus(user.id, status);
  }

  @Get('rides')
  async getMyRides(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: RideStatus,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.driverService.getMyRides(user.id, pageNum, limitNum, status);
  }

  @Get('rides/available')
  async getAvailableRides(@CurrentUser() user: any) {
    return this.driverService.getAvailableRides(user.id);
  }

  @Post('rides/:id/accept')
  async acceptRide(
    @CurrentUser() user: any,
    @Param('id') rideId: string,
  ) {
    return this.driverService.acceptRide(user.id, rideId);
  }

  @Post('rides/:id/refuse')
  async refuseRide(
    @CurrentUser() user: any,
    @Param('id') rideId: string,
    @Body('reason') reason?: string,
  ) {
    return this.driverService.refuseRide(user.id, rideId, reason);
  }

  @Post('rides/:id/start')
  async startRide(
    @CurrentUser() user: any,
    @Param('id') rideId: string,
  ) {
    return this.driverService.startRide(user.id, rideId);
  }

  @Post('rides/:id/complete')
  async completeRide(
    @CurrentUser() user: any,
    @Param('id') rideId: string,
  ) {
    return this.driverService.completeRide(user.id, rideId);
  }

  @Post('profile/request-update')
  async requestProfileUpdate(
    @CurrentUser() user: any,
    @Body() updateDto: RequestProfileUpdateDto,
  ) {
    return this.driverService.requestProfileUpdate(user.id, updateDto);
  }

  @Post('vehicle')
  async registerVehicle(
    @CurrentUser() user: any,
    @Body() vehicleDto: CreateVehicleDto,
  ) {
    return this.driverService.registerVehicle(user.id, vehicleDto);
  }

  @Get('vehicle')
  async getMyVehicle(@CurrentUser() user: any) {
    return this.driverService.getMyVehicle(user.id);
  }
}

