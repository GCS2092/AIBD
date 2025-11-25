import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateConfigDto {
  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  @IsOptional()
  description?: string;
}

