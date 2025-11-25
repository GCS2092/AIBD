import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ride } from '../entities/ride.entity';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class GpsService {
  constructor(
    @InjectRepository(Ride)
    private rideRepository: Repository<Ride>,
  ) {}

  async updateDriverLocation(rideId: string, locationDto: UpdateLocationDto) {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Course non trouvée');
    }

    // Mettre à jour la position du chauffeur
    ride.driverLocation = {
      lat: locationDto.lat,
      lng: locationDto.lng,
      timestamp: new Date(),
    };

    await this.rideRepository.save(ride);

    return {
      message: 'Position mise à jour',
      location: ride.driverLocation,
    };
  }

  async getDriverLocation(rideId: string) {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
      select: ['id', 'driverLocation', 'pickupLocation', 'dropoffLocation'],
    });

    if (!ride) {
      throw new NotFoundException('Course non trouvée');
    }

    return {
      driverLocation: ride.driverLocation,
      pickupLocation: ride.pickupLocation,
      dropoffLocation: ride.dropoffLocation,
    };
  }

  async calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): Promise<number> {
    // Formule de Haversine pour calculer la distance en km
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  async getEstimatedTime(rideId: string): Promise<number | null> {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
    });

    if (!ride || !ride.driverLocation || !ride.pickupLocation) {
      return null;
    }

    // Calculer la distance
    const distance = await this.calculateDistance(
      ride.driverLocation.lat,
      ride.driverLocation.lng,
      ride.pickupLocation.lat,
      ride.pickupLocation.lng,
    );

    // Estimation : 30 km/h en moyenne en ville (Dakar)
    const averageSpeed = 30; // km/h
    const timeInHours = distance / averageSpeed;
    const timeInMinutes = Math.ceil(timeInHours * 60);

    return timeInMinutes;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}

