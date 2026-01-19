// src/modules/config/config.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { ConfigService } from './config.service';
import { Public } from '../../common/decorators/public.decorator';
@Public()
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  // Configuración general del sistema
  @Public()
  @Get()
  getGeneralConfig() {
    return this.configService.getSystemConfig();
  }

  // Configuración específica por kiosco
  @Public()
  @Get('kiosco/:id')
  getKioscoConfig(@Param('id') id: string) {
    return this.configService.getKioskConfig(id);
  }

  // Health check
  @Public()
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'kiosco-api'
    };
  }
}