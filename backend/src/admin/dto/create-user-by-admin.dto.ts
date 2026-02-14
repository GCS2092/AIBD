import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsEnum,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../../entities/user.entity';

export class CreateUserByAdminDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  /** Obligatoire si role === 'driver' */
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => o.role === UserRole.DRIVER)
  licenseNumber?: string;

  @IsString()
  @IsOptional()
  serviceZone?: string;
}
