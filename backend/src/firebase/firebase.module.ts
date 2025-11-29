import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      useFactory: (configService: ConfigService) => {
        const projectId = configService.get<string>('FIREBASE_PROJECT_ID');
        const privateKey = configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
        const clientEmail = configService.get<string>('FIREBASE_CLIENT_EMAIL');

        if (!projectId || !privateKey || !clientEmail) {
          console.warn('⚠️ Firebase non configuré - variables d\'environnement manquantes');
          return null;
        }

        // Vérifier si Firebase est déjà initialisé
        if (!admin.apps.length) {
          try {
            const app = admin.initializeApp({
              credential: admin.credential.cert({
                projectId,
                privateKey,
                clientEmail,
              }),
            });
            console.log('✅ Firebase Admin SDK initialisé avec succès');
            return app;
          } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation de Firebase:', error);
            return null;
          }
        }
        
        return admin.app();
      },
      inject: [ConfigService],
    },
  ],
  exports: ['FIREBASE_ADMIN'],
})
export class FirebaseModule {}


