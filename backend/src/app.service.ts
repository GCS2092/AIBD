import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'AIBD API - Transport Dakar ↔ Aéroport';
  }
}
