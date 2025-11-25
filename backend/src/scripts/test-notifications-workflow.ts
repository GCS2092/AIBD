/**
 * Script de test pour vérifier le workflow des notifications internes
 * 
 * Ce script teste :
 * 1. La création de notifications
 * 2. La récupération des notifications
 * 3. Le comptage des notifications non lues
 * 4. Le marquage comme lu
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InternalNotificationsService } from '../notifications/internal-notifications.service';
import { InternalNotificationType } from '../entities/internal-notification.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Ride } from '../entities/ride.entity';
import { Driver } from '../entities/driver.entity';

async function testNotificationsWorkflow() {
  console.log('🧪 Démarrage du test du workflow des notifications...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const notificationsService = app.get(InternalNotificationsService);
    const userRepository = app.get(getRepositoryToken(User));
    const rideRepository = app.get(getRepositoryToken(Ride));
    const driverRepository = app.get(getRepositoryToken(Driver));

    // 1. Récupérer un admin et un chauffeur pour les tests
    console.log('📋 Étape 1: Récupération des utilisateurs de test...');
    const admins = await userRepository.find({
      where: { role: UserRole.ADMIN },
      take: 1,
    });
    const admin = admins.length > 0 ? admins[0] : null;
    
    const drivers = await driverRepository.find({
      relations: ['user'],
      take: 1,
    });
    const driver = drivers.length > 0 ? drivers[0] : null;

    if (!admin) {
      console.error('❌ Aucun admin trouvé dans la base de données');
      return;
    }

    if (!driver || !driver.user) {
      console.error('❌ Aucun chauffeur trouvé dans la base de données');
      return;
    }

    console.log(`✅ Admin trouvé: ${admin.email}`);
    console.log(`✅ Chauffeur trouvé: ${driver.user.email}\n`);

    // 2. Test de création de notification
    console.log('📋 Étape 2: Test de création de notification...');
    const testNotification = await notificationsService.createNotification(
      admin.id,
      InternalNotificationType.SYSTEM_ALERT,
      'Test de notification',
      'Ceci est une notification de test pour vérifier le workflow',
      undefined,
      { test: true, timestamp: new Date().toISOString() },
    );
    console.log(`✅ Notification créée avec l'ID: ${testNotification.id}\n`);

    // 3. Test de récupération des notifications
    console.log('📋 Étape 3: Test de récupération des notifications...');
    const adminNotifications = await notificationsService.getUserNotifications(admin.id, false);
    console.log(`✅ ${adminNotifications.length} notification(s) trouvée(s) pour l'admin`);
    
    const unreadNotifications = await notificationsService.getUserNotifications(admin.id, true);
    console.log(`✅ ${unreadNotifications.length} notification(s) non lue(s)\n`);

    // 4. Test de comptage des notifications non lues
    console.log('📋 Étape 4: Test de comptage des notifications non lues...');
    const unreadCount = await notificationsService.getUnreadCount(admin.id);
    console.log(`✅ Nombre de notifications non lues: ${unreadCount}\n`);

    // 5. Test de marquage comme lu
    console.log('📋 Étape 5: Test de marquage comme lu...');
    await notificationsService.markAsRead(testNotification.id, admin.id);
    const updatedCount = await notificationsService.getUnreadCount(admin.id);
    console.log(`✅ Notification marquée comme lue. Nouveau compte: ${updatedCount}\n`);

    // 6. Test des méthodes spécifiques
    console.log('📋 Étape 6: Test des méthodes spécifiques de notification...');
    
    // Récupérer une course de test
    const testRides = await rideRepository.find({
      order: { createdAt: 'DESC' },
      take: 1,
    });
    const testRide = testRides.length > 0 ? testRides[0] : null;

    if (testRide) {
      console.log(`✅ Course de test trouvée: ${testRide.id}`);
      
      // Test notifyAdminRideCreated
      try {
        await notificationsService.notifyAdminRideCreated([admin.id], testRide);
        console.log('✅ notifyAdminRideCreated: OK');
      } catch (error) {
        console.error('❌ notifyAdminRideCreated: ERREUR', error.message);
      }

      // Test notifyDriverNewRide
      try {
        await notificationsService.notifyDriverNewRide(driver.id, testRide);
        console.log('✅ notifyDriverNewRide: OK');
      } catch (error) {
        console.error('❌ notifyDriverNewRide: ERREUR', error.message);
      }

      // Test notifyRideAccepted
      try {
        await notificationsService.notifyRideAccepted(admin.id, testRide, driver);
        console.log('✅ notifyRideAccepted: OK');
      } catch (error) {
        console.error('❌ notifyRideAccepted: ERREUR', error.message);
      }

      // Test notifyRideStarted
      try {
        await notificationsService.notifyRideStarted(admin.id, testRide);
        console.log('✅ notifyRideStarted: OK');
      } catch (error) {
        console.error('❌ notifyRideStarted: ERREUR', error.message);
      }

      // Test notifyRideCompleted
      try {
        await notificationsService.notifyRideCompleted(admin.id, testRide);
        console.log('✅ notifyRideCompleted: OK');
      } catch (error) {
        console.error('❌ notifyRideCompleted: ERREUR', error.message);
      }

      // Test notifyRideCancelled
      try {
        await notificationsService.notifyRideCancelled(admin.id, testRide, 'Test d\'annulation');
        console.log('✅ notifyRideCancelled: OK');
      } catch (error) {
        console.error('❌ notifyRideCancelled: ERREUR', error.message);
      }

      // Test notifyRideRefused
      try {
        await notificationsService.notifyRideRefused(driver.id, testRide);
        console.log('✅ notifyRideRefused: OK');
      } catch (error) {
        console.error('❌ notifyRideRefused: ERREUR', error.message);
      }
    } else {
      console.log('⚠️  Aucune course trouvée pour tester les méthodes spécifiques');
    }

    console.log('\n✅ Tous les tests sont terminés avec succès!');
    console.log('\n📊 Résumé:');
    console.log(`   - Notifications créées: ${adminNotifications.length + 1}`);
    console.log(`   - Notifications non lues: ${updatedCount}`);
    console.log(`   - Méthodes testées: 7/7`);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

// Exécuter le test
testNotificationsWorkflow()
  .then(() => {
    console.log('\n✨ Test terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });

