import { IsString, IsOptional, Matches } from 'class-validator';

export class RequestProfileUpdateDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+2(21|42)[0-9]{9}$/, {
    message: 'Le téléphone doit être au format +221XXXXXXXXX (Sénégal) ou +242XXXXXXXXX (Congo)',
  })
  phone?: string;
}

