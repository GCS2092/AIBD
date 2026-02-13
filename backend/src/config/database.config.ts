import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const databaseUrl = configService.get<string>('DATABASE_URL');

  // Supabase / Neon / tout hébergeur qui fournit une URL unique
  if (databaseUrl) {
    const url = databaseUrl.includes('?') ? databaseUrl : `${databaseUrl}?sslmode=require`;
    return {
      type: 'postgres',
      url,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false, // jamais en auto : utiliser les migrations
      logging: !isProduction,
      ssl: url.includes('sslmode=require') || url.includes('supabase')
        ? { rejectUnauthorized: false }
        : undefined,
    };
  }

  // Connexion locale ou via DB_HOST / DB_PORT / etc.
  const host = configService.get<string>('DB_HOST', 'localhost');
  const dbSsl = configService.get<string>('DB_SSL');
  const useSsl = dbSsl === 'true' || (isProduction && host !== 'localhost' && host !== '127.0.0.1');

  return {
    type: 'postgres',
    host,
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_DATABASE', 'AIBD'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: !isProduction,
    logging: !isProduction,
    ...(useSsl && {
      ssl: { rejectUnauthorized: false },
    }),
  };
};
