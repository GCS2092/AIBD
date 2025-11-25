import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post('rides/:id')
  async rateRide(
    @Param('id') rideId: string,
    @Body() createDto: CreateRatingDto,
  ) {
    return this.ratingsService.rateRide(rideId, createDto);
  }

  @Get('rides/:id')
  async getRideRating(@Param('id') rideId: string) {
    return this.ratingsService.getRideRating(rideId);
  }

  @Get('drivers/:id')
  async getDriverRatings(@Param('id') driverId: string) {
    return this.ratingsService.getDriverRatings(driverId);
  }
}

