// src/main.ts - ✅ VERSIÓN CORREGIDA Y PROBADA
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  // 🔥 CREAR APP CON SOPORTE PARA EXPRESS (necesario para archivos estáticos)
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ═══════════════════════════════════════════════════════════════
  // 🖼️ SERVIR ARCHIVOS ESTÁTICOS - ✅ CONFIGURACIÓN CORREGIDA
  // ═══════════════════════════════════════════════════════════════
  
  // 🔥 CRÍTICO: Usar RUTAS ABSOLUTAS porque __dirname en dist/ no funciona bien
  
  // IMÁGENES: /app/public/imagenes → http://IP:3000/public/imagenes/
  app.useStaticAssets('/app/public/imagenes', {
    prefix: '/public/imagenes/', // ✅ Debe coincidir exactamente
    setHeaders: (res) => {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      res.set('Cache-Control', 'public, max-age=31536000');
    },
  });

  // VIDEOS: /app/uploads/videos → http://IP:3000/uploads/videos/
  app.useStaticAssets('/app/uploads/videos', {
    prefix: '/uploads/videos/', // ✅ Debe coincidir exactamente
    setHeaders: (res) => {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      res.set('Cache-Control', 'public, max-age=86400');
    },
  });

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📁 ARCHIVOS ESTÁTICOS CONFIGURADOS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🖼️  Imágenes:');
  console.log('   Carpeta física: /app/public/imagenes');
  console.log('   URL pública:    /public/imagenes/');
  console.log('   Ejemplo:        http://172.20.20.5:3000/public/imagenes/producto-123.jpg');
  console.log('');
  console.log('🎥 Videos:');
  console.log('   Carpeta física: /app/uploads/videos');
  console.log('   URL pública:    /uploads/videos/');
  console.log('   Ejemplo:        http://172.20.20.5:3000/uploads/videos/video-123.mp4');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // ═══════════════════════════════════════════════════════════════
  // 🌐 CORS - ✅ CONFIGURACIÓN MEJORADA
  // ═══════════════════════════════════════════════════════════════
  const configService = app.get(ConfigService);
  const corsOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:3001');

  app.enableCors({
    origin: corsOrigins.split(',').map(o => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Disposition'],
  });

  console.log('🌐 CORS habilitado para:', corsOrigins);

  // ═══════════════════════════════════════════════════════════════
  // 🔧 VALIDACIÓN GLOBAL DE DTOs
  // ═══════════════════════════════════════════════════════════════
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ═══════════════════════════════════════════════════════════════
  // 🌐 PREFIJO GLOBAL "api"
  // ═══════════════════════════════════════════════════════════════
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  app.setGlobalPrefix(apiPrefix);

  // ═══════════════════════════════════════════════════════════════
  // 🚀 INICIAR SERVIDOR
  // ═══════════════════════════════════════════════════════════════
  const port = configService.get<number>('PORT', 3000);
  const host = configService.get<string>('API_HOST', '172.20.20.5');

  await app.listen(port, '0.0.0.0');

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 Servidor corriendo en: http://${host}:${port}/${apiPrefix}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📍 Endpoints API:');
  console.log(`   🔓 POST http://${host}:${port}/${apiPrefix}/auth/login`);
  console.log(`   🔓 POST http://${host}:${port}/${apiPrefix}/licenses/activate`);
  console.log(`   🔓 GET  http://${host}:${port}/${apiPrefix}/productos`);
  console.log('');
  console.log('🖼️  Archivos estáticos (IMÁGENES):');
  console.log(`   📁 Carpeta física: /app/public/imagenes`);
  console.log(`   🌐 URL base: http://${host}:${port}/public/imagenes/`);
  console.log(`   📸 Ejemplo: http://${host}:${port}/public/imagenes/producto-123.jpg`);
  console.log('');
  console.log('🎥 Archivos estáticos (VIDEOS):');
  console.log(`   📁 Carpeta física: /app/uploads/videos`);
  console.log(`   🌐 URL base: http://${host}:${port}/uploads/videos/`);
  console.log(`   🎬 Ejemplo: http://${host}:${port}/uploads/videos/video-123.mp4`);
  console.log('');
  console.log('🔐 Autenticación:');
  console.log('   - Rutas 🔓: Sin autenticación (públicas)');
  console.log('   - Rutas 🔒: Requieren header "Authorization: Bearer <token>"');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

bootstrap();