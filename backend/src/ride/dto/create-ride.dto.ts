import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  Matches,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { RideType } from '../../entities/ride.entity';

export class CreateRideDto {
  @IsString()
  @IsNotEmpty()
  clientFirstName: string;

  @IsString()
  @IsNotEmpty()
  clientLastName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+2(21|42)[0-9]{9}$/, {
    message: 'Le téléphone doit être au format +221XXXXXXXXX (Sénégal) ou +242XXXXXXXXX (Congo)',
  })
  clientPhone: string;

  @Transform(({ value }) => {
    // Transformer les chaînes vides en undefined
    if (value === '' || value === null) {
      return undefined;
    }
    return value;
  })
  @ValidateIf((o) => o.clientEmail !== undefined && o.clientEmail !== null && o.clientEmail !== '')
  @IsEmail({}, { message: 'L\'email doit être valide' })
  @IsOptional()
  clientEmail?: string;

  @IsString()
  @IsNotEmpty()
  pickupAddress: string;

  @IsString()
  @IsNotEmpty()
  dropoffAddress: string;

  @IsEnum(RideType)
  @IsNotEmpty()
  rideType: RideType;

  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsString()
  @IsOptional()
  flightNumber?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  numberOfPassengers?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  numberOfBags?: number;

  @IsString()
  @IsOptional()
  specialRequests?: string;
}

