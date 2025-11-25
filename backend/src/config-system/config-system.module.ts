import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigSystemService } from './config-system.service';
import { ConfigSystemController } from './config-system.controller';
import { Config } from '../entities/config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Config])],
  controllers: [ConfigSystemController],
  providers: [ConfigSystemService],
  exports: [ConfigSystemService],
})
export class ConfigSystemModule implements OnModuleInit {
  constructor(private configSystemService: ConfigSystemService) {}

  async onModuleInit() {
    // Initialiser les configurations par défaut au démarrage
    await this.configSystemService.initializeDefaultConfig();
  }
}

