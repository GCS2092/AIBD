import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ConfigSystemService } from './config-system.service';
import { UpdateConfigDto } from './dto/update-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ConfigSystemController {
  constructor(private readonly configSystemService: ConfigSystemService) {}

  @Get()
  async getAllConfig() {
    return this.configSystemService.getAllConfig();
  }

  @Get(':key')
  async getConfig(@Param('key') key: string) {
    const value = await this.configSystemService.getConfig(key);
    return { key, value };
  }

  @Post(':key')
  async setConfig(
    @Param('key') key: string,
    @Body('value') value: string,
    @Body('description') description?: string,
  ) {
    return this.configSystemService.setConfig(key, value, description);
  }

  @Put(':key')
  async updateConfig(
    @Param('key') key: string,
    @Body() updateDto: UpdateConfigDto,
  ) {
    return this.configSystemService.updateConfig(key, updateDto);
  }

  @Post('initialize/defaults')
  async initializeDefaults() {
    await this.configSystemService.initializeDefaultConfig();
    return { message: 'Configurations par défaut initialisées' };
  }
}

