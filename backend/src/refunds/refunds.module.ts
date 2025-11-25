import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefundsService } from './refunds.service';
import { RefundsController } from './refunds.controller';
import { Ride } from '../entities/ride.entity';
import { Cancellation } from '../entities/cancellation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ride, Cancellation])],
  controllers: [RefundsController],
  providers: [RefundsService],
  exports: [RefundsService],
})
export class RefundsModule {}

