import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { promises as dns } from 'dns';

export const getDatabaseConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const databaseUrl = configService.get<string>('DATABASE_URL');

  // Priorité à DATABASE_URL (Supabase, Render Postgres, etc.)
  if (databaseUrl) {
    const url = new URL(databaseUrl);
    const hostname = url.hostname;
    
    // Détecter si c'est une IPv6 directe (ne peut pas être convertie en IPv4)
    const isIPv6 = hostname.match(/^[0-9a-f:]+$/i) && hostname.includes(':');
    
    if (isIPv6) {
      console.error(`❌ DATABASE_URL contient une adresse IPv6 directe (${hostname}).`);
      console.error(`   Utilisez l'URL pooler de Supabase (Session mode) ou l'Internal Database URL de Render Postgres.`);
      throw new Error(`DATABASE_URL contains IPv6 address. Use Supabase pooler URL (Session mode) or Render Internal Database URL instead.`);
    }
    
    // Si c'est un hostname (pas une IP), essayer de résoudre en IPv4
    let finalHostname = hostname;
    try {
      const addresses = await dns.resolve4(hostname);
      if (addresses && addresses.length > 0) {
        finalHostname = addresses[0]; // Utiliser la première IPv4
        console.log(`✅ Résolution IPv4 pour ${hostname}: ${finalHostname}`);
      }
    } catch (e) {
      // Si résolution IPv4 échoue, garder l'hostname original (peut résoudre en IPv4 au runtime)
      console.warn(`⚠️ Impossible de résoudre IPv4 pour ${hostname}, utilisation de l'hostname original`);
    }
    
    // Reconstruire l'URL avec l'IPv4 ou l'hostname
    url.hostname = finalHostname;
    const finalUrl = url.toString();
    
    return {
      type: 'postgres',
      url: finalUrl.includes('?') ? finalUrl : `${finalUrl}?sslmode=require`,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false,
      logging: !isProduction,
      ssl: { rejectUnauthorized: false },
      extra: {
        ssl: { rejectUnauthorized: false },
        max: 5,
        min: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      },
    };
  }

  // Supabase Transaction Pooler (recommandé) : DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME
  const host = configService.get<string>('DB_HOST');
  if (!host) {
    throw new Error('Either DATABASE_URL or DB_HOST must be set. For Supabase use Transaction Pooler: DB_HOST=xxx.pooler.supabase.com, DB_PORT=6543, DB_USERNAME=postgres.xxx, DB_PASSWORD=..., DB_NAME=postgres');
  }

  // Résoudre le hostname en IPv4 si nécessaire (évite ENETUNREACH sur Render)
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

  const portRaw = configService.get<string>('DB_PORT') || '6543'; // 6543 = Supabase Transaction Pooler
  const port = parseInt(portRaw, 10) || 6543;
  const database = configService.get<string>('DB_NAME') || configService.get<string>('DB_DATABASE') || 'postgres';

  return {
    type: 'postgres',
    host: finalHost,
    port,
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database,
    ssl: { rejectUnauthorized: false },
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false,
    logging: !isProduction,
    extra: {
      ssl: { rejectUnauthorized: false },
      max: 5,
      min: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    },
  };
};