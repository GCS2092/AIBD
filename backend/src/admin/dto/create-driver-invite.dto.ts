import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateDriverInviteDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}

