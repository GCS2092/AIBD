import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Validation des variables d'environnement
  const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '6543'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    
    // SSL obligatoire pour Supabase
    ssl: {
      rejectUnauthorized: false
    },
    
    // Configuration optimisée pour Transaction Pooler
    extra: {
      // Pool de connexions
      max: 10,  // Maximum 10 connexions simultanées
      min: 2,   // Minimum 2 connexions maintenues
      
      // Timeouts
      idleTimeoutMillis: 30000,        // Ferme les connexions inactives après 30s
      connectionTimeoutMillis: 10000,  // Timeout de connexion à 10s
      
      // Gestion des erreurs
      statement_timeout: 30000,  // Timeout des requêtes à 30s
    },
    
    // Entities
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    
    // IMPORTANT: Ne jamais mettre synchronize: true en production
    synchronize: false,
    
    // Logging
    logging: isProduction ? ['error', 'warn'] : true,
    
    // Retry en cas d'échec
    retryAttempts: 3,
    retryDelay: 3000,
    
    // Pour éviter les problèmes de timezone
    timezone: 'Z',
  };
};