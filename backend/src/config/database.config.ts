import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const host = configService.get<string>('DB_HOST', 'localhost');
  const dbSsl = configService.get<string>('DB_SSL');
  
  // SSL seulement si:
  // 1. DB_SSL est explicitement défini à 'true'
  // 2. Ou si on est en production ET que le host n'est pas localhost
  const useSsl = dbSsl === 'true' || (isProduction && host !== 'localhost' && host !== '127.0.0.1');
  
  return {
    type: 'postgres',
    host: host,
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_DATABASE', 'AIBD'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: !isProduction, // false en production
    logging: !isProduction,
    // SSL conditionnel - seulement si nécessaire (Render PostgreSQL, etc.)
    ...(useSsl && {
      ssl: {
        rejectUnauthorized: false, // Render utilise des certificats auto-signés
      },
    }),
  };
};
