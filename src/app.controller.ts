import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // ═══════════════════════════════════════════════════════════════
  // 🏥 HEALTH CHECK PRINCIPAL
  // ═══════════════════════════════════════════════════════════════
  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      service: 'Kiosko API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      endpoints: {
        productos: '/productos',
        videos: '/videos',
        imagenes: '/imagenes',
        kioscos: '/kioscos'
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 🏥 HEALTH CHECK - PRODUCTOS
  // ═══════════════════════════════════════════════════════════════
  @Get('productos/health')
  productosHealthCheck() {
    return {
      status: 'ok',
      service: 'Productos API',
      timestamp: new Date().toISOString(),
      endpoint: '/productos'
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 🏥 HEALTH CHECK - VIDEOS
  // ═══════════════════════════════════════════════════════════════
  @Get('videos/health')
  videosHealthCheck() {
    return {
      status: 'ok',
      service: 'Videos API',
      timestamp: new Date().toISOString(),
      endpoint: '/videos'
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 🏥 HEALTH CHECK - IMÁGENES
  // ═══════════════════════════════════════════════════════════════
  @Get('imagenes/health')
  imagenesHealthCheck() {
    return {
      status: 'ok',
      service: 'Imágenes API',
      timestamp: new Date().toISOString(),
      endpoint: '/imagenes',
      path: './public/imagenes'
    };
  }
}