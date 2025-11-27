import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Ride } from '../entities/ride.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

async function generateAccessCodeForLastRide() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    console.log('✅ Connexion à la base de données réussie');

    const rideRepository = app.get<Repository<Ride>>(getRepositoryToken(Ride));

    // Récupérer la dernière course
    const lastRide = await rideRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    if (!lastRide) {
      console.log('❌ Aucune course trouvée dans la base de données');
      await app.close();
      return;
    }

    // Générer un code d'accès si pas déjà présent
    if (!lastRide.accessCode) {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let accessCode = '';
      for (let i = 0; i < 8; i++) {
        accessCode += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      // Vérifier l'unicité
      const existingRide = await rideRepository.findOne({
        where: { accessCode },
      });

      if (existingRide) {
        // Si le code existe déjà, en générer un nouveau
        accessCode = '';
        for (let i = 0; i < 8; i++) {
          accessCode += characters.charAt(Math.floor(Math.random() * characters.length));
        }
      }

      lastRide.accessCode = accessCode;
      await rideRepository.save(lastRide);

      console.log('\n✅ Code d\'accès généré avec succès !');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📋 ID de la course: ${lastRide.id}`);
      console.log(`🔐 CODE D'ACCÈS: ${accessCode}`);
      console.log(`📅 Date de création: ${lastRide.createdAt}`);
      console.log(`📊 Statut: ${lastRide.status}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.log('\n✅ La course a déjà un code d\'accès !');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📋 ID de la course: ${lastRide.id}`);
      console.log(`🔐 CODE D'ACCÈS: ${lastRide.accessCode}`);
      console.log(`📅 Date de création: ${lastRide.createdAt}`);
      console.log(`📊 Statut: ${lastRide.status}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    await app.close();
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

generateAccessCodeForLastRide();

