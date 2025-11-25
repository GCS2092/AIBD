import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';
import { Ride } from '../entities/ride.entity';
import { Driver } from '../entities/driver.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ride, Driver])],
  controllers: [RatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}

