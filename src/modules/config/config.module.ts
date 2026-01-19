// src/modules/config/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';
import { KioscosModule } from '../kioscos/kioscos.module';

@Module({
  imports: [KioscosModule], // Importar para validar kioscos y obtener su información
  controllers: [ConfigController],
  providers: [ConfigService],
  exports: [ConfigService] // Exportar por si otros módulos necesitan la configuración
})
export class ConfigModule {}