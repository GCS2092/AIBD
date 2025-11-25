import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../entities/user.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { Ride, RideStatus } from '../entities/ride.entity';
import { Pricing } from '../entities/pricing.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { CreateDriverInviteDto } from './dto/create-driver-invite.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { EncryptionService } from '../encryption/encryption.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(Ride)
    private rideRepository: Repository<Ride>,
    @InjectRepository(Pricing)
    private pricingRepository: Repository<Pricing>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    private encryptionService: EncryptionService,
  ) {}

  async createDriverInvite(createDto: CreateDriverInviteDto) {
    // Générer un token unique
    const token = uuidv4();

    // Créer un chauffeur non vérifié avec le token
    const driver = this.driverRepository.create({
      registrationToken: token,
      isVerified: false,
      status: DriverStatus.UNAVAILABLE,
    });

    await this.driverRepository.save(driver);

    return {
      message: 'Lien d\'inscription généré avec succès',
      token,
      registrationLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register/driver/${token}`,
      driverId: driver.id,
    };
  }

  async getAllDrivers(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Driver>> {
    const skip = (page - 1) * limit;
    
    const [drivers, total] = await this.driverRepository.findAndCount({
      relations: ['user', 'vehicles', 'rides'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    // S'assurer que le service d'encryption est injecté pour déchiffrer
    drivers.forEach(driver => {
      // Injecter le service dans le driver
      driver.setEncryptionService(this.encryptionService);
      
      // Injecter le service dans l'utilisateur
      if (driver.user) {
        driver.user.setEncryptionService(this.encryptionService);
        // Forcer le déchiffrement en accédant aux propriétés (déclenche AfterLoad)
        const email = driver.user.email;
        const phone = driver.user.phone;
        // Si toujours chiffré, déchiffrer manuellement
        if (email && email.includes(':')) {
          try {
            driver.user.email = this.encryptionService.decrypt(email);
          } catch (e) {
            // Ignorer si échec
          }
        }
        if (phone && phone.includes(':')) {
          try {
            driver.user.phone = this.encryptionService.decrypt(phone);
          } catch (e) {
            // Ignorer si échec
          }
        }
      }
      
      // Forcer le déchiffrement du permis
      if (driver.licenseNumber && driver.licenseNumber.includes(':')) {
        try {
          driver.licenseNumber = this.encryptionService.decrypt(driver.licenseNumber);
        } catch (e) {
          // Ignorer si échec
        }
      }
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: drivers,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async getDriverById(id: string) {
    const driver = await this.driverRepository.findOne({
      where: { id },
      relations: ['user', 'vehicles', 'rides'],
    });

    if (!driver) {
      throw new NotFoundException('Chauffeur non trouvé');
    }

    // S'assurer que le service d'encryption est injecté pour déchiffrer
    driver.setEncryptionService(this.encryptionService);
    if (driver.user) {
      driver.user.setEncryptionService(this.encryptionService);
      // Déchiffrer manuellement si nécessaire
      if (driver.user.email && driver.user.email.includes(':')) {
        try {
          driver.user.email = this.encryptionService.decrypt(driver.user.email);
        } catch (e) {
          // Ignorer si échec
        }
      }
      if (driver.user.phone && driver.user.phone.includes(':')) {
        try {
          driver.user.phone = this.encryptionService.decrypt(driver.user.phone);
        } catch (e) {
          // Ignorer si échec
        }
      }
    }
    // Déchiffrer le permis si nécessaire
    if (driver.licenseNumber && driver.licenseNumber.includes(':')) {
      try {
        driver.licenseNumber = this.encryptionService.decrypt(driver.licenseNumber);
      } catch (e) {
        // Ignorer si échec
      }
    }

    return driver;
  }

  async assignRideToDriver(rideId: string, driverId: string) {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
      relations: ['driver'],
    });

    if (!ride) {
      throw new NotFoundException('Course non trouvée');
    }

    const driver = await this.driverRepository.findOne({
      where: { id: driverId },
      relations: ['user'],
    });

    if (!driver) {
      throw new NotFoundException('Chauffeur non trouvé');
    }

    if (driver.status !== DriverStatus.AVAILABLE && driver.status !== DriverStatus.UNAVAILABLE) {
      throw new BadRequestException('Le chauffeur n\'est pas disponible');
    }

    if (!driver.isVerified) {
      throw new BadRequestException('Le chauffeur n\'est pas vérifié');
    }

    // Assigner le chauffeur
    ride.driverId = driver.id;
    ride.status = RideStatus.ASSIGNED;
    ride.assignedAt = new Date();

    await this.rideRepository.save(ride);

    // Notifier le chauffeur (via notification service)
    if (driver.user) {
      driver.user.setEncryptionService(this.encryptionService);
      // La notification sera gérée par le service de notifications
    }

    return ride;
  }

  async updateDriver(id: string, updateDto: UpdateDriverDto) {
    const driver = await this.driverRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!driver) {
      throw new NotFoundException('Chauffeur non trouvé');
    }

    // Mettre à jour le chauffeur
    if (updateDto.status !== undefined) {
      driver.status = updateDto.status;
    }
    if (updateDto.isVerified !== undefined) {
      driver.isVerified = updateDto.isVerified;
      if (updateDto.isVerified && driver.status === DriverStatus.UNAVAILABLE) {
        driver.status = DriverStatus.AVAILABLE;
      }
    }
    if (updateDto.licenseNumber !== undefined) {
      driver.licenseNumber = updateDto.licenseNumber;
    }
    if (updateDto.serviceZone !== undefined) {
      driver.serviceZone = updateDto.serviceZone;
    }
    if (updateDto.workSchedule !== undefined) {
      driver.workSchedule = updateDto.workSchedule;
    }

    await this.driverRepository.save(driver);

    // Mettre à jour l'utilisateur si nécessaire
    if (driver.user) {
      if (updateDto.firstName !== undefined) {
        driver.user.firstName = updateDto.firstName;
      }
      if (updateDto.lastName !== undefined) {
        driver.user.lastName = updateDto.lastName;
      }
      if (updateDto.email !== undefined) {
        driver.user.email = updateDto.email;
      }
      if (updateDto.phone !== undefined) {
        driver.user.phone = updateDto.phone;
      }
      await this.userRepository.save(driver.user);
    }

    return this.getDriverById(id);
  }

  async getAllRides(
    page: number = 1,
    limit: number = 10,
    filters?: {
      status?: RideStatus;
      driverId?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string; // Recherche par nom, prénom, téléphone ou email
    }
  ): Promise<PaginatedResponse<Ride>> {
    const skip = (page - 1) * limit;
    
    // Construire la requête avec les filtres
    const queryBuilder = this.rideRepository.createQueryBuilder('ride')
      .leftJoinAndSelect('ride.driver', 'driver')
      .leftJoinAndSelect('driver.user', 'user')
      .orderBy('ride.createdAt', 'DESC');

    // Appliquer les filtres avant de compter
    if (filters?.status) {
      queryBuilder.andWhere('ride.status = :status', { status: filters.status });
    }
    if (filters?.driverId) {
      queryBuilder.andWhere('ride.driverId = :driverId', { driverId: filters.driverId });
    }
    if (filters?.startDate) {
      queryBuilder.andWhere('ride.scheduledAt >= :startDate', { startDate: filters.startDate });
    }
    if (filters?.endDate) {
      queryBuilder.andWhere('ride.scheduledAt <= :endDate', { endDate: filters.endDate });
    }

    // Compter le total (avant pagination)
    const total = await queryBuilder.getCount();

    // Appliquer la pagination
    queryBuilder.skip(skip).take(limit);

    // Récupérer les données
    let rides = await queryBuilder.getMany();

    // S'assurer que le service d'encryption est injecté pour déchiffrer
    rides.forEach(ride => {
      ride.setEncryptionService(this.encryptionService);
      
      // Déchiffrer les données de la course
      if (ride.clientFirstName && ride.clientFirstName.includes(':')) {
        try {
          ride.clientFirstName = this.encryptionService.decrypt(ride.clientFirstName);
        } catch (e) {}
      }
      if (ride.clientLastName && ride.clientLastName.includes(':')) {
        try {
          ride.clientLastName = this.encryptionService.decrypt(ride.clientLastName);
        } catch (e) {}
      }
      if (ride.clientPhone && ride.clientPhone.includes(':')) {
        try {
          ride.clientPhone = this.encryptionService.decrypt(ride.clientPhone);
        } catch (e) {}
      }
      if (ride.clientEmail && ride.clientEmail.includes(':')) {
        try {
          ride.clientEmail = this.encryptionService.decrypt(ride.clientEmail);
        } catch (e) {}
      }
      if (ride.pickupAddress && ride.pickupAddress.includes(':')) {
        try {
          ride.pickupAddress = this.encryptionService.decrypt(ride.pickupAddress);
        } catch (e) {}
      }
      if (ride.dropoffAddress && ride.dropoffAddress.includes(':')) {
        try {
          ride.dropoffAddress = this.encryptionService.decrypt(ride.dropoffAddress);
        } catch (e) {}
      }
      
      // Déchiffrer les données du chauffeur si présent
      if (ride.driver?.user) {
        ride.driver.user.setEncryptionService(this.encryptionService);
        if (ride.driver.user.email && ride.driver.user.email.includes(':')) {
          try {
            ride.driver.user.email = this.encryptionService.decrypt(ride.driver.user.email);
          } catch (e) {}
        }
        if (ride.driver.user.phone && ride.driver.user.phone.includes(':')) {
          try {
            ride.driver.user.phone = this.encryptionService.decrypt(ride.driver.user.phone);
          } catch (e) {}
        }
      }
      if (ride.driver) {
        ride.driver.setEncryptionService(this.encryptionService);
      }
    });

    // Appliquer le filtre de recherche après déchiffrement (car on ne peut pas chercher dans des données chiffrées)
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      rides = rides.filter(ride => 
        ride.clientFirstName?.toLowerCase().includes(searchLower) ||
        ride.clientLastName?.toLowerCase().includes(searchLower) ||
        ride.clientPhone?.toLowerCase().includes(searchLower) ||
        ride.clientEmail?.toLowerCase().includes(searchLower)
      );
    }

    const totalPages = Math.ceil(total / limit);

    return {
      data: rides,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async getDashboardStats() {
    const [
      totalRides,
      completedRides,
      pendingRides,
      totalDrivers,
      activeDrivers,
      totalRevenue,
    ] = await Promise.all([
      this.rideRepository.count(),
      this.rideRepository.count({ where: { status: RideStatus.COMPLETED } }),
      this.rideRepository.count({ where: { status: RideStatus.PENDING } }),
      this.driverRepository.count(),
      this.driverRepository.count({ where: { status: DriverStatus.AVAILABLE } }),
      this.rideRepository
        .createQueryBuilder('ride')
        .select('SUM(ride.price)', 'total')
        .where('ride.status = :status', { status: RideStatus.COMPLETED })
        .getRawOne(),
    ]);

    // Rides par jour (7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const ridesByDay = await this.rideRepository
      .createQueryBuilder('ride')
      .select('DATE(ride.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('ride.createdAt >= :date', { date: sevenDaysAgo })
      .groupBy('DATE(ride.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      rides: {
        total: totalRides,
        completed: completedRides,
        pending: pendingRides,
        byDay: ridesByDay,
      },
      drivers: {
        total: totalDrivers,
        active: activeDrivers,
      },
      revenue: {
        total: parseFloat(totalRevenue?.total || '0'),
      },
    };
  }

  async getRideById(id: string) {
    const ride = await this.rideRepository.findOne({
      where: { id },
      relations: ['driver', 'driver.user', 'pricing'],
    });

    if (!ride) {
      throw new NotFoundException('Course non trouvée');
    }

    // S'assurer que le service d'encryption est injecté pour déchiffrer
    ride.setEncryptionService(this.encryptionService);
    if (ride.driver?.user) {
      ride.driver.user.setEncryptionService(this.encryptionService);
      const _ = ride.driver.user.email;
      const __ = ride.driver.user.phone;
    }
    if (ride.driver) {
      ride.driver.setEncryptionService(this.encryptionService);
      if (ride.driver.licenseNumber) {
        const _ = ride.driver.licenseNumber;
      }
    }

    return ride;
  }

  async getAllVehicles(
    page: number = 1,
    limit: number = 10,
    driverId?: string
  ): Promise<PaginatedResponse<Vehicle>> {
    const skip = (page - 1) * limit;
    
    const query = this.vehicleRepository.createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.driver', 'driver')
      .leftJoinAndSelect('driver.user', 'user')
      .orderBy('vehicle.createdAt', 'DESC');

    if (driverId) {
      query.where('vehicle.driverId = :driverId', { driverId });
    }

    // Compter le total
    const total = await query.getCount();

    // Appliquer la pagination
    query.skip(skip).take(limit);

    const vehicles = await query.getMany();

    // Déchiffrer les données sensibles
    vehicles.forEach(vehicle => {
      if (vehicle.driver?.user) {
        vehicle.driver.user.setEncryptionService(this.encryptionService);
        if (vehicle.driver.user.email && vehicle.driver.user.email.includes(':')) {
          try {
            vehicle.driver.user.email = this.encryptionService.decrypt(vehicle.driver.user.email);
          } catch (e) {}
        }
        if (vehicle.driver.user.phone && vehicle.driver.user.phone.includes(':')) {
          try {
            vehicle.driver.user.phone = this.encryptionService.decrypt(vehicle.driver.user.phone);
          } catch (e) {}
        }
      }
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: vehicles,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}

