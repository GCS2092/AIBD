import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EncryptionService } from './encryption.service';
import { User } from '../entities/user.entity';
import { Ride } from '../entities/ride.entity';
import { Driver } from '../entities/driver.entity';

@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
  constructor(private encryptionService: EncryptionService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap((data) => {
        // Injecter le service dans les entités retournées
        if (Array.isArray(data)) {
          data.forEach((item) => this.injectService(item));
        } else {
          this.injectService(data);
        }
      }),
    );
  }

  private injectService(entity: any) {
    if (!entity) return;

    // Vérifier si c'est une instance d'entité (via méthode setEncryptionService)
    if (entity && typeof entity.setEncryptionService === 'function') {
      entity.setEncryptionService(this.encryptionService);
    }

    // Récursif pour les objets imbriqués
    if (typeof entity === 'object' && entity !== null) {
      Object.values(entity).forEach((value) => {
        if (value && typeof value === 'object') {
          this.injectService(value);
        }
      });
    }
  }
}

