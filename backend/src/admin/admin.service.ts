import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { Ride, RideStatus } from '../entities/ride.entity';
import { Pricing } from '../entities/pricing.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { CreateDriverInviteDto } from './dto/create-driver-invite.dto';
import { CreateDriverDto } from './dto/create-driver.dto';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';
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

  private decryptUserData(user: User): void {
    if (!this.encryptionService || !user) return;
    user.setEncryptionService(this.encryptionService);
    if (user.email && typeof user.email === 'string' && user.email.includes(':')) {
      try {
        user.email = this.encryptionService.decrypt(user.email);
      } catch (e) {
        console.warn('[Admin] Erreur déchiffrement email user:', e);
      }
    }
    if (user.phone && typeof user.phone === 'string' && user.phone.includes(':')) {
      try {
        user.phone = this.encryptionService.decrypt(user.phone);
      } catch (e) {
        console.warn('[Admin] Erreur déchiffrement phone user:', e);
      }
    }
  }

  async getAllUsers(page: number = 1, limit: number = 10): Promise<PaginatedResponse<User>> {
    const skip = (page - 1) * limit;
    const [users, total] = await this.userRepository.findAndCount({
      relations: ['driver'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    users.forEach((u) => this.decryptUserData(u));
    const totalPages = Math.ceil(total / limit);
    return {
      data: users,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async createUser(createDto: CreateUserByAdminDto): Promise<{ user: User; driver?: Driver }> {
    const emailHash = this.encryptionService.hashForSearch(createDto.email.toLowerCase().trim());
    const existingUser = await this.userRepository.findOne({ where: { emailHash } });
    if (existingUser) {
      throw new BadRequestException('Cet email est déjà utilisé');
    }
    const hashedPassword = await bcrypt.hash(createDto.password, 10);
    const user = this.userRepository.create({
      firstName: createDto.firstName,
      lastName: createDto.lastName,
      email: createDto.email,
      password: hashedPassword,
      phone: createDto.phone,
      role: createDto.role,
      isActive: createDto.isActive ?? true,
    });
    user.setEncryptionService(this.encryptionService);
    const savedUser = await this.userRepository.save(user);
    this.decryptUserData(savedUser);

    if (createDto.role === UserRole.DRIVER) {
      if (!createDto.licenseNumber?.trim()) {
        throw new BadRequestException('Le numéro de permis est obligatoire pour un chauffeur');
      }
      const existingDriver = await this.driverRepository.findOne({
        where: { licenseNumber: createDto.licenseNumber },
      });
      if (existingDriver) {
        throw new BadRequestException('Ce numéro de permis est déjà utilisé');
      }
      const driver = this.driverRepository.create({
        userId: savedUser.id,
        licenseNumber: createDto.licenseNumber,
        serviceZone: createDto.serviceZone ?? undefined,
        status: DriverStatus.UNAVAILABLE,
        isVerified: true,
      });
      driver.setEncryptionService(this.encryptionService);
      const savedDriver = await this.driverRepository.save(driver);
      return { user: savedUser, driver: savedDriver };
    }
    return { user: savedUser };
  }

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

  async createDriver(createDto: CreateDriverDto): Promise<{ user: User; driver: Driver }> {
    // Vérifier si l'email existe déjà (via hash)
    const emailHash = this.encryptionService.hashForSearch(createDto.email.toLowerCase().trim());
    const existingUser = await this.userRepository.findOne({
      where: { emailHash },
    });

    if (existingUser) {
      throw new BadRequestException('Cet email est déjà utilisé');
    }

    // Vérifier si le numéro de permis existe déjà
    const existingDriver = await this.driverRepository.findOne({
      where: { licenseNumber: createDto.licenseNumber },
    });

    if (existingDriver) {
      throw new BadRequestException('Ce numéro de permis est déjà utilisé');
    }

    // Créer l'utilisateur
    const hashedPassword = await bcrypt.hash(createDto.password, 10);
    const user = this.userRepository.create({
      firstName: createDto.firstName,
      lastName: createDto.lastName,
      email: createDto.email, // Sera chiffré automatiquement par l'entité
      password: hashedPassword,
      phone: createDto.phone, // Sera chiffré automatiquement par l'entité
      role: UserRole.DRIVER,
      isActive: true,
    });

    // Injecter le service d'encryption avant sauvegarde
    user.setEncryptionService(this.encryptionService);
    const savedUser = await this.userRepository.save(user);

    // Créer le chauffeur
    const driver = this.driverRepository.create({
      userId: savedUser.id,
      licenseNumber: createDto.licenseNumber, // Sera chiffré automatiquement
      serviceZone: createDto.serviceZone,
      status: DriverStatus.UNAVAILABLE,
      isVerified: true, // Directement vérifié car créé par admin
    });

    // Injecter le service d'encryption avant sauvegarde
    driver.setEncryptionService(this.encryptionService);
    const savedDriver = await this.driverRepository.save(driver);

    return {
      user: savedUser,
      driver: savedDriver,
    };
  }

  /**
   * Déchiffre toutes les données sensibles d'un driver pour l'affichage admin
   * IMPORTANT: Les données restent chiffrées en base de données, mais sont déchiffrées ici pour l'affichage
   * Cette méthode est appelée uniquement pour les requêtes admin afin d'afficher les données en clair
   */
  /**
   * Déchiffre toutes les données sensibles d'une course pour l'affichage admin
   */
  private decryptRideData(ride: Ride): void {
    ride.setEncryptionService(this.encryptionService);
    
    // Fonction helper pour déchiffrer si nécessaire
    const decryptIfNeeded = (value: string | undefined): string => {
      if (!value) return '';
      if (typeof value === 'string' && value.includes(':')) {
        try {
          return this.encryptionService.decrypt(value);
        } catch (e) {
          console.warn(`[Admin] Erreur déchiffrement pour ride ${ride.id}:`, e);
          return value;
        }
      }
      return value;
    };
    
    // Déchiffrer toutes les données du client
    ride.clientEmail = decryptIfNeeded(ride.clientEmail);
    ride.clientPhone = decryptIfNeeded(ride.clientPhone);
    ride.clientFirstName = decryptIfNeeded(ride.clientFirstName);
    ride.clientLastName = decryptIfNeeded(ride.clientLastName);
    ride.pickupAddress = decryptIfNeeded(ride.pickupAddress);
    ride.dropoffAddress = decryptIfNeeded(ride.dropoffAddress);
    
    // Déchiffrer les données du chauffeur si présent
    if (ride.driver) {
      this.decryptDriverData(ride.driver);
    }
  }

  private decryptDriverData(driver: Driver): void {
    if (!this.encryptionService) {
      console.error('[Admin] EncryptionService non disponible');
      return;
    }

    // Injecter le service d'encryption
    driver.setEncryptionService(this.encryptionService);
    
    // Déchiffrer le numéro de permis
    if (driver.licenseNumber) {
      if (typeof driver.licenseNumber === 'string' && driver.licenseNumber.includes(':')) {
        try {
          const decrypted = this.encryptionService.decrypt(driver.licenseNumber);
          driver.licenseNumber = decrypted;
          console.log(`[Admin] LicenseNumber déchiffré pour driver ${driver.id}`);
        } catch (e) {
          console.error(`[Admin] Erreur déchiffrement licenseNumber pour driver ${driver.id}:`, e);
        }
      }
    }
    
    // Déchiffrer les données de l'utilisateur
    if (driver.user) {
      driver.user.setEncryptionService(this.encryptionService);
      
      // Déchiffrer email - FORCER le déchiffrement
      // IMPORTANT: Les hooks @AfterLoad() peuvent ne pas fonctionner si le service n'est pas injecté à temps
      // On force donc le déchiffrement manuellement ici
      if (driver.user.email && typeof driver.user.email === 'string') {
        const originalEmail = driver.user.email;
        
        // Vérifier si c'est chiffré (format: iv:tag:encrypted)
        if (originalEmail.includes(':') && originalEmail.split(':').length === 3) {
          try {
            const decrypted = this.encryptionService.decrypt(originalEmail);
            // FORCER la modification de la propriété
            Object.defineProperty(driver.user, 'email', {
              value: decrypted,
              writable: true,
              enumerable: true,
              configurable: true
            });
            console.log(`[Admin] ✓ Email déchiffré pour driver ${driver.id}: ${decrypted.substring(0, Math.min(30, decrypted.length))}...`);
          } catch (e) {
            console.error(`[Admin] ❌ Erreur déchiffrement email pour driver ${driver.id}:`, e);
            console.error(`[Admin] Email chiffré (premiers 50 chars): ${originalEmail.substring(0, 50)}...`);
          }
        } else {
          // Email non chiffré ou format invalide
          console.log(`[Admin] Email non chiffré pour driver ${driver.id}: ${originalEmail.substring(0, 30)}...`);
        }
      } else {
        console.warn(`[Admin] ⚠ Email manquant ou invalide pour driver ${driver.id}`);
      }
      
      // Déchiffrer téléphone - FORCER le déchiffrement
      if (driver.user.phone && typeof driver.user.phone === 'string') {
        const originalPhone = driver.user.phone;
        
        // Vérifier si c'est chiffré (format: iv:tag:encrypted)
        if (originalPhone.includes(':') && originalPhone.split(':').length === 3) {
          try {
            const decrypted = this.encryptionService.decrypt(originalPhone);
            // FORCER la modification de la propriété
            Object.defineProperty(driver.user, 'phone', {
              value: decrypted,
              writable: true,
              enumerable: true,
              configurable: true
            });
            console.log(`[Admin] ✓ Phone déchiffré pour driver ${driver.id}: ${decrypted}`);
          } catch (e) {
            console.error(`[Admin] ❌ Erreur déchiffrement phone pour driver ${driver.id}:`, e);
            console.error(`[Admin] Phone chiffré (premiers 50 chars): ${originalPhone.substring(0, 50)}...`);
          }
        } else {
          // Phone non chiffré ou format invalide
          console.log(`[Admin] Phone non chiffré pour driver ${driver.id}: ${originalPhone}`);
        }
      } else {
        console.warn(`[Admin] ⚠ Phone manquant ou invalide pour driver ${driver.id}`);
      }
      
      // Déchiffrer firstName si chiffré
      if (driver.user.firstName && typeof driver.user.firstName === 'string' && driver.user.firstName.includes(':')) {
        try {
          driver.user.firstName = this.encryptionService.decrypt(driver.user.firstName);
        } catch (e) {
          console.warn(`[Admin] Erreur déchiffrement firstName pour driver ${driver.id}:`, e);
        }
      }
      
      // Déchiffrer lastName si chiffré
      if (driver.user.lastName && typeof driver.user.lastName === 'string' && driver.user.lastName.includes(':')) {
        try {
          driver.user.lastName = this.encryptionService.decrypt(driver.user.lastName);
        } catch (e) {
          console.warn(`[Admin] Erreur déchiffrement lastName pour driver ${driver.id}:`, e);
        }
      }
    } else {
      console.warn(`[Admin] User manquant pour driver ${driver.id}`);
    }
  }

  async getAllDrivers(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Driver>> {
    const skip = (page - 1) * limit;
    
    // Charger les drivers avec leurs relations
    // IMPORTANT: Ne pas utiliser les hooks @AfterLoad() qui pourraient interférer
    // On va déchiffrer manuellement après le chargement
    const [drivers, total] = await this.driverRepository.findAndCount({
      relations: ['user', 'vehicles', 'rides'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    // IMPORTANT: Déchiffrer toutes les données sensibles pour l'affichage admin
    // Les données restent chiffrées en base de données, mais sont déchiffrées ici pour l'affichage
    console.log(`[Admin] Déchiffrement de ${drivers.length} chauffeurs pour l'affichage admin`);
    
    // Déchiffrer directement les entités chargées
    drivers.forEach((driver, index) => {
      console.log(`[Admin] Traitement chauffeur ${index + 1}/${drivers.length} - ID: ${driver.id}`);
      
      // Stocker les valeurs originales pour debug
      const originalEmail = driver.user?.email;
      const originalPhone = driver.user?.phone;
      
      // Déchiffrer les données
      this.decryptDriverData(driver);
      
      // Vérifier que le déchiffrement a fonctionné
      if (driver.user) {
        if (driver.user.email && driver.user.email.includes(':')) {
          console.error(`[Admin] ❌ Email toujours chiffré après déchiffrement pour driver ${driver.id}`);
          console.error(`[Admin] Email original: ${originalEmail?.substring(0, 50)}...`);
        } else if (driver.user.email) {
          console.log(`[Admin] ✓ Email déchiffré: ${driver.user.email.substring(0, 30)}...`);
        }
        
        if (driver.user.phone && driver.user.phone.includes(':')) {
          console.error(`[Admin] ❌ Phone toujours chiffré après déchiffrement pour driver ${driver.id}`);
          console.error(`[Admin] Phone original: ${originalPhone?.substring(0, 50)}...`);
        } else if (driver.user.phone) {
          console.log(`[Admin] ✓ Phone déchiffré: ${driver.user.phone}`);
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

    // IMPORTANT: Déchiffrer toutes les données sensibles pour l'affichage admin
    // Les données restent chiffrées en base de données, mais sont déchiffrées ici pour l'affichage
    this.decryptDriverData(driver);

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

    // IMPORTANT: Déchiffrer toutes les données sensibles pour l'affichage admin
    // Les données restent chiffrées en base de données, mais sont déchiffrées ici pour l'affichage
    rides.forEach(ride => {
      this.decryptRideData(ride);
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
    // Compter toutes les courses
    const totalRides = await this.rideRepository.count();
    
    // Compter les courses complétées
    const completedRides = await this.rideRepository.count({ 
      where: { status: RideStatus.COMPLETED } 
    });
    
    // Compter les courses en attente
    const pendingRides = await this.rideRepository.count({ 
      where: { status: RideStatus.PENDING } 
    });
    
    // Compter les courses assignées
    const assignedRides = await this.rideRepository.count({ 
      where: { status: RideStatus.ASSIGNED } 
    });
    
    // Compter les courses acceptées
    const acceptedRides = await this.rideRepository.count({ 
      where: { status: RideStatus.ACCEPTED } 
    });
    
    // Compter les courses annulées
    const cancelledRides = await this.rideRepository.count({ 
      where: { status: RideStatus.CANCELLED } 
    });
    
    // Compter tous les chauffeurs
    const totalDrivers = await this.driverRepository.count();
    
    // Compter les chauffeurs actifs (disponibles)
    const activeDrivers = await this.driverRepository.count({ 
      where: { status: DriverStatus.AVAILABLE } 
    });
    
    // Calculer le revenu total (seulement les courses complétées)
    const revenueResult = await this.rideRepository
      .createQueryBuilder('ride')
      .select('COALESCE(SUM(ride.price), 0)', 'total')
      .where('ride.status = :status', { status: RideStatus.COMPLETED })
      .getRawOne();
    
    const totalRevenue = parseFloat(revenueResult?.total || '0');
    
    // Vérifier la cohérence des compteurs
    const ridesSum = completedRides + pendingRides + assignedRides + acceptedRides + cancelledRides;
    const inProgressRides = await this.rideRepository.count({
      where: [
        { status: RideStatus.IN_PROGRESS },
        { status: RideStatus.DRIVER_ON_WAY },
        { status: RideStatus.PICKED_UP }
      ]
    });
    
    // Calculer la note moyenne des chauffeurs
    const avgRatingResult = await this.driverRepository
      .createQueryBuilder('driver')
      .select('COALESCE(AVG(driver.rating), 0)', 'avgRating')
      .where('driver.ratingCount > 0')
      .getRawOne();
    
    const avgRating = parseFloat(avgRatingResult?.avgRating || '0');

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

    // Revenus par jour (7 derniers jours) - seulement courses complétées
    const revenueByDay = await this.rideRepository
      .createQueryBuilder('ride')
      .select('DATE(ride.completedAt)', 'date')
      .addSelect('COALESCE(SUM(ride.price), 0)', 'revenue')
      .where('ride.status = :status', { status: RideStatus.COMPLETED })
      .andWhere('ride.completedAt >= :date', { date: sevenDaysAgo })
      .groupBy('DATE(ride.completedAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      rides: {
        total: totalRides,
        completed: completedRides,
        pending: pendingRides,
        assigned: assignedRides,
        accepted: acceptedRides,
        cancelled: cancelledRides,
        inProgress: inProgressRides,
        byDay: ridesByDay,
      },
      drivers: {
        total: totalDrivers,
        active: activeDrivers,
        avgRating: Math.round(avgRating * 10) / 10, // Arrondir à 1 décimale
      },
      revenue: {
        total: totalRevenue,
        byDay: revenueByDay,
      },
      // Validation des compteurs
      validation: {
        ridesSum: ridesSum + inProgressRides,
        totalRides: totalRides,
        isValid: (ridesSum + inProgressRides) <= totalRides, // La somme peut être inférieure si d'autres statuts existent
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

    // IMPORTANT: Déchiffrer toutes les données sensibles pour l'affichage admin
    // Les données restent chiffrées en base de données, mais sont déchiffrées ici pour l'affichage
    // La méthode decryptRideData déchiffre automatiquement toutes les données (client + chauffeur)
    this.decryptRideData(ride);

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

  async createVehicle(createVehicleDto: { brand: string; model: string; licensePlate: string; color?: string; year?: number; capacity?: number; photoUrl?: string; driverId: string }): Promise<Vehicle> {
    // Vérifier que le chauffeur existe
    const driver = await this.driverRepository.findOne({
      where: { id: createVehicleDto.driverId },
    });

    if (!driver) {
      throw new NotFoundException('Chauffeur non trouvé');
    }

    // Vérifier que l'immatriculation n'existe pas déjà
    const existingVehicle = await this.vehicleRepository.findOne({
      where: { licensePlate: createVehicleDto.licensePlate },
    });

    if (existingVehicle) {
      throw new BadRequestException('Cette immatriculation est déjà enregistrée');
    }

    const vehicle = this.vehicleRepository.create({
      brand: createVehicleDto.brand,
      model: createVehicleDto.model,
      licensePlate: createVehicleDto.licensePlate,
      color: createVehicleDto.color,
      year: createVehicleDto.year,
      capacity: createVehicleDto.capacity,
      photoUrl: createVehicleDto.photoUrl,
      driverId: createVehicleDto.driverId,
      isActive: true,
    });

    return await this.vehicleRepository.save(vehicle);
  }
}

