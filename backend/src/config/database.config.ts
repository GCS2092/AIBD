import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_DATABASE', 'AIBD'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: !isProduction, // false en production
    logging: !isProduction,
    // SSL requis pour Render PostgreSQL (même en dev)
    ssl: {
      rejectUnauthorized: false, // Render utilise des certificats auto-signés
    },
  };
};
