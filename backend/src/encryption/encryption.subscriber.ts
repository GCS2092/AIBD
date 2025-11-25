import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  LoadEvent,
  DataSource,
} from 'typeorm';
import { User } from '../entities/user.entity';
import { Ride } from '../entities/ride.entity';
import { Driver } from '../entities/driver.entity';
import { EncryptionService } from './encryption.service';

@EventSubscriber()
export class EncryptionSubscriber implements EntitySubscriberInterface {
  private encryptionService: EncryptionService;

  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
    // Le service sera injecté via le module
  }

  setEncryptionService(service: EncryptionService) {
    this.encryptionService = service;
  }

  // Injecter le service dans les entités lors du chargement
  afterLoad(entity: any, event?: LoadEvent<any>) {
    if (!this.encryptionService) return;
    
    if (entity instanceof User || entity instanceof Ride || entity instanceof Driver) {
      entity.setEncryptionService(this.encryptionService);
    }
  }

  // Injecter le service avant insertion
  beforeInsert(event: InsertEvent<any>) {
    if (!this.encryptionService) return;
    
    if (
      event.entity instanceof User ||
      event.entity instanceof Ride ||
      event.entity instanceof Driver
    ) {
      event.entity.setEncryptionService(this.encryptionService);
    }
  }

  // Injecter le service avant mise à jour
  beforeUpdate(event: UpdateEvent<any>) {
    if (!this.encryptionService) return;
    
    if (
      event.entity instanceof User ||
      event.entity instanceof Ride ||
      event.entity instanceof Driver
    ) {
      event.entity.setEncryptionService(this.encryptionService);
    }
  }
}
