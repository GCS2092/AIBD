import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pricing } from '../entities/pricing.entity';
import { CreatePricingDto } from './dto/create-pricing.dto';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(Pricing)
    private pricingRepository: Repository<Pricing>,
  ) {}

  async getAllPricing(rideType?: string, includeInactive: boolean = false) {
    const query = this.pricingRepository.createQueryBuilder('pricing');

    if (!includeInactive) {
      query.where('pricing.isActive = :isActive', { isActive: true });
    }

    if (rideType) {
      if (includeInactive) {
        query.where('pricing.rideType = :rideType', { rideType });
      } else {
        query.andWhere('pricing.rideType = :rideType', { rideType });
      }
    }

    return query.orderBy('pricing.rideType', 'ASC').addOrderBy('pricing.type', 'ASC').getMany();
  }

  async getPricingById(id: string) {
    const pricing = await this.pricingRepository.findOne({
      where: { id },
    });

    if (!pricing) {
      throw new NotFoundException('Tarif non trouvé');
    }

    return pricing;
  }

  async createPricing(createDto: CreatePricingDto) {
    const pricing = this.pricingRepository.create(createDto);
    return this.pricingRepository.save(pricing);
  }

  async updatePricing(id: string, updateDto: Partial<CreatePricingDto>) {
    const pricing = await this.pricingRepository.findOne({
      where: { id },
    });

    if (!pricing) {
      throw new NotFoundException('Tarif non trouvé');
    }

    Object.assign(pricing, updateDto);
    return this.pricingRepository.save(pricing);
  }

  async deletePricing(id: string) {
    const pricing = await this.pricingRepository.findOne({
      where: { id },
    });

    if (!pricing) {
      throw new NotFoundException('Tarif non trouvé');
    }

    pricing.isActive = false;
    return this.pricingRepository.save(pricing);
  }
}

