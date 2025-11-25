import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserRole } from '../entities/user.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { EncryptionService } from '../encryption/encryption.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    private jwtService: JwtService,
    private encryptionService: EncryptionService,
  ) {}

  private hashForSearch(value: string): string {
    return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
  }

  async validateUser(email: string, password: string): Promise<any> {
    // Normaliser l'email
    const normalizedEmail = email.toLowerCase().trim();
    const emailHash = this.hashForSearch(normalizedEmail);
    
    // Chercher par hash (le hash est maintenant calculé sur l'email en clair)
    let user = await this.userRepository.findOne({
      where: { emailHash },
      relations: ['driver'],
    });

    // Si pas trouvé par hash, chercher dans tous les utilisateurs (fallback)
    if (!user) {
      const allUsers = await this.userRepository.find({
        relations: ['driver'],
      });
      
      for (const u of allUsers) {
        u.setEncryptionService(this.encryptionService);
        // Recharger pour déclencher AfterLoad
        const reloaded = await this.userRepository.findOne({
          where: { id: u.id },
          relations: ['driver'],
        });
        if (reloaded) {
          reloaded.setEncryptionService(this.encryptionService);
          const decryptedEmail = reloaded.email?.toLowerCase().trim();
          if (decryptedEmail === normalizedEmail) {
            user = reloaded;
            break;
          }
        }
      }
    }

    if (!user) {
      return null;
    }

    // Injecter le service pour déchiffrer
    user.setEncryptionService(this.encryptionService);

    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return null;
    }

    if (!user.isActive) {
      return null;
    }

    const { password: pwd, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Compte désactivé');
    }

    // L'email est déjà déchiffré par AfterLoad si le service est injecté
    // Mais pour être sûr, on utilise l'email déchiffré
    const userEmail = user.email; // Déjà déchiffré par AfterLoad si service injecté
    
    const payload = { email: userEmail, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: userEmail,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        driver: user.driver,
      },
    };
  }

  async registerDriver(
    token: string,
    registerDto: RegisterDriverDto,
  ): Promise<any> {
    // Vérifier le token d'inscription
    const driver = await this.driverRepository.findOne({
      where: { registrationToken: token, isVerified: false },
    });

    if (!driver) {
      throw new BadRequestException('Token d\'inscription invalide ou déjà utilisé');
    }

    // Vérifier si l'email existe déjà (via hash)
    const emailHash = this.hashForSearch(registerDto.email);
    const existingUser = await this.userRepository.findOne({
      where: { emailHash },
    });

    if (existingUser) {
      throw new BadRequestException('Cet email est déjà utilisé');
    }

    // Créer l'utilisateur
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = this.userRepository.create({
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email, // Sera chiffré automatiquement par l'entité
      password: hashedPassword,
      phone: registerDto.phone, // Sera chiffré automatiquement par l'entité
      role: UserRole.DRIVER,
      isActive: true,
    });

    // Injecter le service d'encryption avant sauvegarde
    user.setEncryptionService(this.encryptionService);
    const savedUser = await this.userRepository.save(user);

    // Mettre à jour le chauffeur
    driver.setEncryptionService(this.encryptionService);
    if (registerDto.licenseNumber) {
      driver.licenseNumber = registerDto.licenseNumber; // Sera chiffré automatiquement
    }
    if (registerDto.serviceZone) {
      driver.serviceZone = registerDto.serviceZone;
    }
    if (registerDto.workSchedule) {
      driver.workSchedule = registerDto.workSchedule;
    }
    driver.userId = savedUser.id;
    driver.status = DriverStatus.UNAVAILABLE; // Pas encore disponible jusqu'à validation admin
    driver.registrationToken = null as any; // Token utilisé
    await this.driverRepository.save(driver);

    // Créer le véhicule
    const vehicle = this.vehicleRepository.create({
      driverId: driver.id,
      brand: registerDto.vehicle.brand,
      model: registerDto.vehicle.model,
      licensePlate: registerDto.vehicle.licensePlate,
      color: registerDto.vehicle.color,
      year: registerDto.vehicle.year,
      capacity: registerDto.vehicle.capacity,
      photoUrl: registerDto.vehicle.photoUrl,
    });
    await this.vehicleRepository.save(vehicle);

    return {
      message: 'Inscription réussie. En attente de validation par l\'administrateur.',
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
      },
    };
  }
}
