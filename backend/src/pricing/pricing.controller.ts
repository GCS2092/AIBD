import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PricingService } from './pricing.service';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  async getAllPricing(
    @Query('rideType') rideType?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const includeInactiveBool = includeInactive === 'true';
    return this.pricingService.getAllPricing(rideType, includeInactiveBool);
  }

  @Get(':id')
  async getPricingById(@Param('id') id: string) {
    return this.pricingService.getPricingById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createPricing(@Body() createDto: CreatePricingDto) {
    return this.pricingService.createPricing(createDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updatePricing(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreatePricingDto>,
  ) {
    return this.pricingService.updatePricing(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deletePricing(@Param('id') id: string) {
    return this.pricingService.deletePricing(id);
  }
}

