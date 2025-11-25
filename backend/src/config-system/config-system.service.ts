import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Config } from '../entities/config.entity';
import { UpdateConfigDto } from './dto/update-config.dto';

@Injectable()
export class ConfigSystemService {
  constructor(
    @InjectRepository(Config)
    private configRepository: Repository<Config>,
  ) {}

  async getConfig(key: string): Promise<string | null> {
    const config = await this.configRepository.findOne({
      where: { key },
    });

    return config?.value || null;
  }

  async getConfigAsNumber(key: string): Promise<number | null> {
    const value = await this.getConfig(key);
    return value ? parseFloat(value) : null;
  }

  async setConfig(key: string, value: string, description?: string) {
    let config = await this.configRepository.findOne({
      where: { key },
    });

    if (config) {
      config.value = value;
      if (description) {
        config.description = description;
      }
    } else {
      config = this.configRepository.create({
        key,
        value,
        description,
      });
    }

    return this.configRepository.save(config);
  }

  async updateConfig(key: string, updateDto: UpdateConfigDto) {
    const config = await this.configRepository.findOne({
      where: { key },
    });

    if (!config) {
      throw new NotFoundException(`Configuration '${key}' non trouvée`);
    }

    config.value = updateDto.value;
    if (updateDto.description !== undefined) {
      config.description = updateDto.description;
    }

    return this.configRepository.save(config);
  }

  async getAllConfig() {
    return this.configRepository.find({
      order: { key: 'ASC' },
    });
  }

  async initializeDefaultConfig() {
    const defaults = [
      { key: 'driver_response_timeout', value: '120', description: 'Timeout de réponse chauffeur en secondes (2 minutes)' },
      { key: 'auto_break_after_rides', value: '5', description: 'Nombre de courses avant pause automatique' },
      { key: 'cancellation_refund_hours_24', value: '24', description: 'Heures avant course pour remboursement 100%' },
      { key: 'cancellation_refund_hours_2', value: '2', description: 'Heures avant course pour remboursement 50%' },
      { key: 'max_consecutive_refusals', value: '3', description: 'Nombre maximum de refus consécutifs avant alerte' },
      { key: 'simultaneous_offer_count', value: '3', description: 'Nombre de chauffeurs à proposer simultanément (3-5 recommandé)' },
      { key: 'multiple_offer_timeout', value: '90', description: 'Timeout en secondes pour les propositions multiples (90 secondes)' },
      { key: 'max_assignment_attempts', value: '7', description: 'Nombre maximum de tentatives d\'assignation avant passage en attente manuelle' },
      { key: 'max_assignment_distance', value: '50', description: 'Distance maximale en km pour l\'assignation (géolocalisation)' },
    ];

    for (const defaultConfig of defaults) {
      const existing = await this.configRepository.findOne({
        where: { key: defaultConfig.key },
      });

      if (!existing) {
        await this.configRepository.save(
          this.configRepository.create(defaultConfig),
        );
      }
    }
  }
}

