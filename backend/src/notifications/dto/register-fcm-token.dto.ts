import { IsString, IsOptional, MaxLength } from 'class-validator';

export class RegisterFcmTokenDto {
  @IsString()
  @MaxLength(500)
  token: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  deviceLabel?: string;
}
