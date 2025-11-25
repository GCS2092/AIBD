import {
  IsString,
  IsNotEmpty,
  IsEmail,
  Matches,
  IsOptional,
  IsObject,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

class VehicleDto {
  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsOptional()
  year?: number;

  @IsOptional()
  capacity?: number;

  @IsString()
  @IsOptional()
  photoUrl?: string;
}

export class RegisterDriverDto {
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
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+221[0-9]{9}$/, {
    message: 'Le téléphone doit être au format +221XXXXXXXXX',
  })
  phone: string;

  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @ValidateNested()
  @Type(() => VehicleDto)
  @IsNotEmpty()
  vehicle: VehicleDto;

  @IsString()
  @IsOptional()
  serviceZone?: string;

  @IsObject()
  @IsOptional()
  workSchedule?: {
    start: string;
    end: string;
    days: number[];
  };
}

