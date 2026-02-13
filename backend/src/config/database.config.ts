import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

export const getDatabaseConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const databaseUrl = configService.get<string>('DATABASE_URL');

  // Priorité à DATABASE_URL (Supabase, Render Postgres, etc.)
  if (databaseUrl) {
    // Parser l'URL pour extraire le hostname et forcer IPv4
    const url = new URL(databaseUrl);
    const hostname = url.hostname;
    
    // Si c'est une adresse IPv6, essayer de résoudre en IPv4
    let finalHostname = hostname;
    if (hostname.includes(':') || hostname.match(/^[0-9a-f:]+$/i)) {
      // C'est une IPv6 ou un hostname qui pourrait résoudre en IPv6
      try {
        const addresses = await dns.resolve4(hostname);
        if (addresses && addresses.length > 0) {
          finalHostname = addresses[0]; // Utiliser la première IPv4
        }
      } catch (e) {
        // Si résolution IPv4 échoue, garder l'hostname original
        console.warn(`Could not resolve IPv4 for ${hostname}, using original`);
      }
    }
    
    // Reconstruire l'URL avec l'IPv4
    url.hostname = finalHostname;
    const finalUrl = url.toString();
    
    return {
      type: 'postgres',
      url: finalUrl.includes('?') ? finalUrl : `${finalUrl}?sslmode=require`,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false,
      logging: !isProduction,
      ssl: { rejectUnauthorized: false },
      extra: { ssl: { rejectUnauthorized: false } },
    };
  }

  // Fallback : DB_HOST / DB_PORT / etc.
  const host = configService.get<string>('DB_HOST');
  if (!host) {
    throw new Error('Either DATABASE_URL or DB_HOST must be set');
  }

  // Résoudre le hostname en IPv4 si nécessaire
  let finalHost = host;
  if (host.includes(':') || host.match(/^[0-9a-f:]+$/i)) {
    try {
      const addresses = await dns.resolve4(host);
      if (addresses && addresses.length > 0) {
        finalHost = addresses[0];
      }
    } catch (e) {
      console.warn(`Could not resolve IPv4 for ${host}, using original`);
    }
  }

  return {
    type: 'postgres',
    host: finalHost,
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME') || configService.get<string>('DB_DATABASE'),
    ssl: { rejectUnauthorized: false },
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false,
    logging: !isProduction,
  };
};