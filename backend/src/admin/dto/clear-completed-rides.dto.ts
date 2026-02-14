import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ClearCompletedRidesDto {
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @MinLength(1, { message: 'Le mot de passe est requis' })
  password: string;
}
