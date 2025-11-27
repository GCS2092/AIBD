import { GeocodingService } from '../geocoding/geocoding.service';

/**
 * Script de test pour le service de géocodage
 * Usage: npm run test:geocoding
 */
async function testGeocoding() {
  const geocodingService = new GeocodingService();

  console.log('🧪 Test du service de géocodage...\n');

  // Test 1: Adresse simple à Dakar
  console.log('Test 1: Géocodage d\'une adresse à Dakar');
  const testAddress1 = 'Aéroport International Blaise Diagne';
  const result1 = await geocodingService.geocodeAddress(testAddress1);
  if (result1) {
    console.log(`✅ Succès: ${testAddress1}`);
    console.log(`   Coordonnées: (${result1.lat}, ${result1.lng})\n`);
  } else {
    console.log(`❌ Échec: ${testAddress1}\n`);
  }

  // Attendre 1 seconde pour respecter la limite de rate limiting
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Adresse avec contexte
  console.log('Test 2: Géocodage d\'une adresse avec contexte');
  const testAddress2 = 'Plateau, Dakar';
  const result2 = await geocodingService.geocodeAddress(testAddress2);
  if (result2) {
    console.log(`✅ Succès: ${testAddress2}`);
    console.log(`   Coordonnées: (${result2.lat}, ${result2.lng})\n`);
  } else {
    console.log(`❌ Échec: ${testAddress2}\n`);
  }

  // Attendre 1 seconde
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: Adresse invalide
  console.log('Test 3: Géocodage d\'une adresse invalide');
  const testAddress3 = 'Adresse qui n\'existe pas 12345';
  const result3 = await geocodingService.geocodeAddress(testAddress3);
  if (result3) {
    console.log(`⚠️  Inattendu: ${testAddress3}`);
    console.log(`   Coordonnées: (${result3.lat}, ${result3.lng})\n`);
  } else {
    console.log(`✅ Comportement attendu: ${testAddress3} (null)\n`);
  }

  console.log('✨ Tests terminés!');
  process.exit(0);
}

testGeocoding().catch((error) => {
  console.error('❌ Erreur lors des tests:', error);
  process.exit(1);
});

