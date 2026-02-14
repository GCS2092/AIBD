import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../entities/user.entity';
import { Driver } from '../entities/driver.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
  imports: [
    EncryptionModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): any => ({
        secret: configService.get<string>('JWT_SECRET') || 'secret',
        signOptions: {
          // 30j = connexion persistante jusqu'à déconnexion (ou définir JWT_EXPIRES_IN en env)
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '30d',
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Driver, Vehicle]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

