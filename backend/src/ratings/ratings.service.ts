import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ride, RideStatus } from '../entities/ride.entity';
import { Driver } from '../entities/driver.entity';
import { CreateRatingDto } from './dto/create-rating.dto';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Ride)
    private rideRepository: Repository<Ride>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
  ) {}

  async rateRide(rideId: string, createDto: CreateRatingDto) {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
      relations: ['driver'],
    });

    if (!ride) {
      throw new NotFoundException('Course non trouvée');
    }

    if (ride.status !== RideStatus.COMPLETED) {
      throw new BadRequestException('Seules les courses terminées peuvent être évaluées');
    }

    if (ride.rating) {
      throw new BadRequestException('Cette course a déjà été évaluée');
    }

    // Mettre à jour la course
    ride.rating = createDto.rating;
    if (createDto.review) {
      ride.review = createDto.review;
    }

    await this.rideRepository.save(ride);

    // Mettre à jour la note moyenne du chauffeur
    if (ride.driverId && ride.driver) {
      const driver = ride.driver;
      const totalRating = driver.rating * driver.ratingCount + createDto.rating;
      driver.ratingCount += 1;
      driver.rating = totalRating / driver.ratingCount;

      await this.driverRepository.save(driver);
    }

    return ride;
  }

  async getRideRating(rideId: string) {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
      select: ['id', 'rating', 'review'],
    });

    if (!ride) {
      throw new NotFoundException('Course non trouvée');
    }

    return {
      rating: ride.rating,
      review: ride.review,
    };
  }

  async getDriverRatings(driverId: string) {
    const rides = await this.rideRepository.find({
      where: {
        driverId,
        status: RideStatus.COMPLETED,
      },
      select: ['id', 'rating', 'review', 'createdAt'],
      order: { createdAt: 'DESC' },
    });

    const ratedRides = rides.filter((r) => r.rating !== null && r.rating !== undefined);

    const driver = await this.driverRepository.findOne({
      where: { id: driverId },
      select: ['rating', 'ratingCount'],
    });

    return {
      averageRating: driver?.rating || 0,
      totalRatings: driver?.ratingCount || 0,
      reviews: ratedRides.map((r) => ({
        rating: r.rating,
        review: r.review,
        date: r.createdAt,
      })),
    };
  }
}

