import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GpsService } from './gps.service';
import { GpsController } from './gps.controller';
import { Ride } from '../entities/ride.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ride])],
  controllers: [GpsController],
  providers: [GpsService],
  exports: [GpsService],
})
export class GpsModule {}

