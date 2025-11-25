import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RideService } from './ride.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('rides')
export class RideController {
  constructor(private readonly rideService: RideService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requêtes par minute
  async createRide(@Body() createDto: CreateRideDto) {
    return this.rideService.createRide(createDto);
  }

  @Get('my-rides')
  async getMyRides(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('phone') phone?: string,
    @Query('email') email?: string,
    @Query('firstName') firstName?: string,
    @Query('lastName') lastName?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.rideService.getClientRides(pageNum, limitNum, phone, email, firstName, lastName);
  }

  @Get(':id/status')
  async getRideStatus(@Param('id') id: string) {
    return this.rideService.getRideStatus(id);
  }

  @Post(':id/cancel')
  async cancelRide(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Body('cancelledBy') cancelledBy: string,
  ) {
    return this.rideService.cancelRide(id, reason, cancelledBy);
  }
}

