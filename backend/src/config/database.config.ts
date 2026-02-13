import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const databaseUrl = configService.get<string>('DATABASE_URL');
  const sslCertPath = configService.get<string>('SSL_ROOT_CERT') || configService.get<string>('DATABASE_SSL_CA');
  const forceInsecure = configService.get<string>('DATABASE_SSL_REJECT_UNAUTHORIZED') === 'false';

  // Supabase / Neon / tout hébergeur qui fournit une URL unique
  if (databaseUrl) {
    const url = databaseUrl.includes('?') ? databaseUrl : `${databaseUrl}?sslmode=require`;
    let sslConfig: { rejectUnauthorized: boolean; ca?: Buffer } = { rejectUnauthorized: false };
    if (!forceInsecure && sslCertPath) {
      const resolvedPath = path.isAbsolute(sslCertPath) ? sslCertPath : path.resolve(process.cwd(), sslCertPath);
      if (fs.existsSync(resolvedPath)) {
        sslConfig = { rejectUnauthorized: true, ca: fs.readFileSync(resolvedPath) };
      }
    }
    if (forceInsecure) {
      sslConfig = { rejectUnauthorized: false };
    }

    return {
      type: 'postgres',
      url,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false,
      logging: !isProduction,
      ssl: sslConfig,
      extra: { ssl: sslConfig },
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
