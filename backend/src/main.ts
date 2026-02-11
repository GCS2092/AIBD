import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as os from 'os';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Détecter automatiquement les IPs locales pour CORS
  const networkInterfaces = os.networkInterfaces();
  const localIPs: string[] = [];
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    if (interfaces) {
      for (const iface of interfaces) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIPs.push(iface.address);
        }
      }
    }
  }

  // Enable CORS for frontend (accepter localhost, IPs locales, Vercel, Render)
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...localIPs.map(ip => `http://${ip}:5173`),
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    process.env.FRONTEND_VERCEL_URL,
    // Origines de production connues (front Vercel)
    'https://aibd-fsdx.vercel.app',
    'https://aibd-fsdx-git-main-gcs2092s-projects.vercel.app',
    // Tous les sous-domaines Vercel (*.vercel.app, *.vercel.com)
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/.*\.vercel\.com$/,
  ].filter((x): x is string | RegExp => Boolean(x));

  const isProduction = process.env.NODE_ENV === 'production';
  
  app.enableCors({
    origin: (origin, callback) => {
      // Permettre les requêtes sans origine (health checks, tests, etc.)
      // En production, on les accepte aussi pour les health checks de Render
      if (!origin) {
        return callback(null, true);
      }
      
      // Vérifier si l'origine est dans la liste autorisée
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') {
          return allowed === origin;
        }
        // Si c'est une regex, tester
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return false;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else if (isProduction) {
        // En production, rejeter les origines non autorisées
        callback(new Error(`CORS: Origin ${origin} not allowed`), false);
      } else {
        // En développement, accepter toutes les origines
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200, // Préflight OPTIONS : certains proxies (ex. Render) attendent 200
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0'); // Permet l'accès depuis le réseau local
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 BACKEND DÉMARRÉ AVEC SUCCÈS`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📍 Local: http://localhost:${port}`);
  
  // Afficher l'IP locale pour l'accès depuis le téléphone
  if (localIPs.length > 0) {
    console.log(`\n🌐 DÉTECTION AUTOMATIQUE DES IPs LOCALES:`);
    localIPs.forEach((ip, index) => {
      console.log(`   IP ${index + 1}: ${ip}`);
    });
    console.log(`\n📡 URLs D'ACCÈS SUR LE RÉSEAU LOCAL:`);
    localIPs.forEach(ip => {
      console.log(`   ✅ Backend API: http://${ip}:${port}`);
      console.log(`   ✅ Frontend:   http://${ip}:5173`);
    });
    console.log(`\n📱 POUR ACCÉDER DEPUIS VOTRE TÉLÉPHONE:`);
    console.log(`   👉 Ouvrez: http://${localIPs[0]}:5173`);
    console.log(`\n🔒 CORS configuré pour accepter les requêtes depuis:`);
    allowedOrigins.forEach(origin => {
      console.log(`   ✅ ${origin}`);
    });
  } else {
    console.log(`\n⚠️  Aucune IP locale détectée. Vérifiez votre connexion réseau.`);
  }
  console.log(`${'='.repeat(60)}\n`);
}
bootstrap();
