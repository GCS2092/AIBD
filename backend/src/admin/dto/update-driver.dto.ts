import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsEnum,
  IsObject,
} from 'class-validator';
import { DriverStatus } from '../../entities/driver.entity';

export class UpdateDriverDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @IsEnum(DriverStatus)
  @IsOptional()
  status?: DriverStatus;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

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

