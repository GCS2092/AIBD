import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateDriverInviteDto } from './dto/create-driver-invite.dto';
import { CreateDriverDto } from './dto/create-driver.dto';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { ClearCompletedRidesDto } from './dto/clear-completed-rides.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { RideStatus } from '../entities/ride.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getAllUsers(pageNum, limitNum);
  }

  @Post('users')
  async createUser(@Body() createDto: CreateUserByAdminDto) {
    return this.adminService.createUser(createDto);
  }

  @Post('drivers/invite')
  async createDriverInvite(@Body() createDto: CreateDriverInviteDto) {
    return this.adminService.createDriverInvite(createDto);
  }

  @Post('drivers')
  async createDriver(@Body() createDto: CreateDriverDto) {
    return this.adminService.createDriver(createDto);
  }

  @Get('drivers')
  async getAllDrivers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getAllDrivers(pageNum, limitNum);
  }

  @Get('drivers/:id')
  async getDriverById(@Param('id') id: string) {
    return this.adminService.getDriverById(id);
  }

  @Put('drivers/:id')
  async updateDriver(
    @Param('id') id: string,
    @Body() updateDto: UpdateDriverDto,
  ) {
    return this.adminService.updateDriver(id, updateDto);
  }

  @Get('rides')
  async getAllRides(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: RideStatus,
    @Query('driverId') driverId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getAllRides(pageNum, limitNum, {
      status,
      driverId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
    });
  }

  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('rides/:id')
  async getRideById(@Param('id') id: string) {
    return this.adminService.getRideById(id);
  }

  @Post('rides/:rideId/assign/:driverId')
  async assignRideToDriver(
    @Param('rideId') rideId: string,
    @Param('driverId') driverId: string,
  ) {
    return this.adminService.assignRideToDriver(rideId, driverId);
  }

  @Post('rides/clear-completed')
  async clearCompletedRides(
    @CurrentUser() user: { id: string },
    @Body() dto: ClearCompletedRidesDto,
  ) {
    return this.adminService.clearCompletedRides(user.id, dto.password);
  }

  @Get('vehicles')
  async getAllVehicles(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('driverId') driverId?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getAllVehicles(pageNum, limitNum, driverId);
  }

  @Post('vehicles')
  async createVehicle(
    @Body() createVehicleDto: { brand: string; model: string; licensePlate: string; color?: string; year?: number; capacity?: number; photoUrl?: string; driverId: string },
  ) {
    return this.adminService.createVehicle(createVehicleDto);
  }
}

