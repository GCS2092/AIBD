import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as os from 'os';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend (accepter localhost et IP locale)
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://192.168.1.118:5173',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Permettre les requêtes sans origine (Postman, curl, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(null, true); // Accepter toutes les origines en dev
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); // Permet l'accès depuis le réseau local
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  
  // Afficher l'IP locale pour l'accès depuis le téléphone
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
  if (localIPs.length > 0) {
    console.log(`🌐 Accessible depuis le réseau local (téléphone) sur:`);
    localIPs.forEach(ip => {
      console.log(`   http://${ip}:${port}`);
    });
  }
}
bootstrap();
