import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Driver } from '../entities/driver.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Données de véhicules réalistes pour le Sénégal
const vehicleData = [
  {
    brand: 'Toyota',
    model: 'Corolla',
    licensePlate: 'DK-1234-AB',
    color: 'Blanc',
    year: 2020,
    capacity: 4,
  },
  {
    brand: 'Mercedes-Benz',
    model: 'Vito',
    licensePlate: 'DK-5678-CD',
    color: 'Noir',
    year: 2019,
    capacity: 8,
  },
  {
    brand: 'Nissan',
    model: 'Almera',
    licensePlate: 'DK-9012-EF',
    color: 'Gris',
    year: 2021,
    capacity: 4,
  },
  {
    brand: 'Hyundai',
    model: 'Elantra',
    licensePlate: 'DK-3456-GH',
    color: 'Bleu',
    year: 2020,
    capacity: 4,
  },
  {
    brand: 'Peugeot',
    model: '508',
    licensePlate: 'DK-7890-IJ',
    color: 'Blanc',
    year: 2018,
    capacity: 4,
  },
  {
    brand: 'Toyota',
    model: 'Camry',
    licensePlate: 'DK-2468-KL',
    color: 'Noir',
    year: 2022,
    capacity: 4,
  },
  {
    brand: 'Volkswagen',
    model: 'Passat',
    licensePlate: 'DK-1357-MN',
    color: 'Gris',
    year: 2019,
    capacity: 4,
  },
  {
    brand: 'Ford',
    model: 'Focus',
    licensePlate: 'DK-8642-OP',
    color: 'Rouge',
    year: 2021,
    capacity: 4,
  },
  {
    brand: 'Renault',
    model: 'Logan',
    licensePlate: 'DK-9753-QR',
    color: 'Blanc',
    year: 2020,
    capacity: 4,
  },
  {
    brand: 'Kia',
    model: 'Rio',
    licensePlate: 'DK-1470-ST',
    color: 'Bleu',
    year: 2021,
    capacity: 4,
  },
];

async function addVehiclesToDrivers() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    
    const driverRepository = app.get<Repository<Driver>>(getRepositoryToken(Driver));
    const vehicleRepository = app.get<Repository<Vehicle>>(getRepositoryToken(Vehicle));

    // Récupérer tous les chauffeurs
    const drivers = await driverRepository.find({
      relations: ['vehicles', 'user'],
    });

    if (drivers.length === 0) {
      console.log('❌ Aucun chauffeur trouvé dans la base de données.');
      await app.close();
      process.exit(0);
    }

    console.log(`\n📋 ${drivers.length} chauffeur(s) trouvé(s)\n`);

    let vehiclesCreated = 0;
    let vehiclesSkipped = 0;

    for (let i = 0; i < drivers.length; i++) {
      const driver = drivers[i];
      
      // Vérifier si le chauffeur a déjà un véhicule
      if (driver.vehicles && driver.vehicles.length > 0) {
        console.log(`⏭️  Chauffeur ${driver.user?.firstName} ${driver.user?.lastName} a déjà un véhicule: ${driver.vehicles[0].brand} ${driver.vehicles[0].model} (${driver.vehicles[0].licensePlate})`);
        vehiclesSkipped++;
        continue;
      }

      // Utiliser les données de véhicule disponibles (en boucle si nécessaire)
      const vehicleInfo = vehicleData[i % vehicleData.length];
      
      // Vérifier si l'immatriculation existe déjà
      const existingVehicle = await vehicleRepository.findOne({
        where: { licensePlate: vehicleInfo.licensePlate },
      });

      if (existingVehicle) {
        // Générer une nouvelle immatriculation unique
        const newPlate = `DK-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
        vehicleInfo.licensePlate = newPlate;
      }

      // Créer le véhicule
      const vehicle = vehicleRepository.create({
        driverId: driver.id,
        brand: vehicleInfo.brand,
        model: vehicleInfo.model,
        licensePlate: vehicleInfo.licensePlate,
        color: vehicleInfo.color,
        year: vehicleInfo.year,
        capacity: vehicleInfo.capacity,
        isActive: true,
      });

      await vehicleRepository.save(vehicle);
      vehiclesCreated++;
      
      console.log(`✅ Véhicule ajouté pour ${driver.user?.firstName} ${driver.user?.lastName}: ${vehicleInfo.brand} ${vehicleInfo.model} (${vehicleInfo.licensePlate})`);
    }

    console.log('\n📊 Résumé:');
    console.log(`- Véhicules créés: ${vehiclesCreated}`);
    console.log(`- Véhicules ignorés (déjà existants): ${vehiclesSkipped}`);
    console.log(`- Total chauffeurs: ${drivers.length}`);

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

addVehiclesToDrivers();

