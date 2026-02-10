import {
  IsString,
  IsOptional,
  IsEmail,
  Matches,
  IsDateString,
  IsEnum,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { RideType } from '../../entities/ride.entity';

const TRIP_TYPES = ['aller_retour', 'aller_simple', 'retour_simple'] as const;

export class UpdateRideByCodeDto {
  @IsString()
  @IsOptional()
  clientFirstName?: string;

  @IsString()
  @IsOptional()
  clientLastName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+2(21|42)[0-9]{9}$/, {
    message: 'Le téléphone doit être au format +221XXXXXXXXX (Sénégal) ou +242XXXXXXXXX (Congo)',
  })
  clientPhone?: string;

  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsOptional()
  @IsEmail({}, { message: 'L\'email doit être valide' })
  clientEmail?: string;

  @IsString()
  @IsOptional()
  pickupAddress?: string;

  @IsString()
  @IsOptional()
  dropoffAddress?: string;

  @IsOptional()
  @IsIn(TRIP_TYPES)
  tripType?: typeof TRIP_TYPES[number];

  @IsOptional()
  @IsEnum(RideType)
  rideType?: RideType;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @IsString()
  @IsOptional()
  flightNumber?: string;

  @IsString()
  @IsOptional()
  pickupCountry?: string;

  @IsString()
  @IsOptional()
  pickupCity?: string;

  @IsString()
  @IsOptional()
  pickupQuartier?: string;

  @IsString()
  @IsOptional()
  dropoffCountry?: string;

  @IsString()
  @IsOptional()
  dropoffCity?: string;

  @IsString()
  @IsOptional()
  dropoffQuartier?: string;
}
