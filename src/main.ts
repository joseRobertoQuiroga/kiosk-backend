// src/main.ts - ✅ CONFIGURACIÓN COMPLETA Y CORREGIDA
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  // 🔥 CREAR APP CON SOPORTE PARA EXPRESS (necesario para archivos estáticos)
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ═══════════════════════════════════════════════════════════════
  // 📁 VERIFICAR Y CREAR CARPETA DE IMÁGENES SI NO EXISTE
  // ═══════════════════════════════════════════════════════════════
  const publicPath = join(__dirname, '..', 'public');
  const imagenesPath = join(publicPath, 'imagenes');

  if (!existsSync(publicPath)) {
    mkdirSync(publicPath, { recursive: true });
    console.log('📁 Carpeta /public creada');
  }

  if (!existsSync(imagenesPath)) {
    mkdirSync(imagenesPath, { recursive: true });
    console.log('📁 Carpeta /public/imagenes creada');
  }

  // ═══════════════════════════════════════════════════════════════
  // 🖼️ SERVIR ARCHIVOS ESTÁTICOS - ✅ CONFIGURACIÓN CORREGIDA
  // ═══════════════════════════════════════════════════════════════
  // IMPORTANTE: Esto permite acceder a las imágenes mediante:
  // http://172.20.20.70:3000/public/imagenes/producto-123.jpg

  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/public/', // ✅ Con barra inicial y final
    setHeaders: (res) => {
      // ✅ AGREGAR HEADERS CORS PARA IMÁGENES
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      res.set('Cache-Control', 'public, max-age=31536000'); // Cache 1 año
    },
  });

  console.log('📁 Ruta física:', join(__dirname, '..', 'public'));
  console.log('🌐 URL pública: /public/');
  console.log('🖼️  Ejemplo: http://localhost:3000/public/imagenes/producto-123.jpg');

  // ═══════════════════════════════════════════════════════════════
  // 🎥 SERVIR ARCHIVOS ESTÁTICOS - VIDEOS
  // ═══════════════════════════════════════════════════════════════
  // IMPORTANTE: Esto permite acceder a los videos mediante:
  // http://192.168.0.151:3000/uploads/videos/video-123.mp4

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/', // ✅ Con barra inicial y final
    setHeaders: (res) => {
      // ✅ AGREGAR HEADERS CORS PARA VIDEOS
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      res.set('Cache-Control', 'public, max-age=86400'); // Cache 1 día
    },
  });

  console.log('📁 Ruta física videos:', join(__dirname, '..', 'uploads'));
  console.log('🌐 URL pública videos: /uploads/');
  console.log('🎥 Ejemplo: http://localhost:3000/uploads/videos/video-123.mp4');

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
  const host = configService.get<string>('API_HOST', '172.20.20.70');

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
  console.log(`   📁 Carpeta física: ${imagenesPath}`);
  console.log(`   🌐 URL base: http://${host}:${port}/public/imagenes/`);
  console.log(`   📸 Ejemplo: http://${host}:${port}/public/imagenes/producto-123.jpg`);
  console.log('');
  console.log('🎥 Archivos estáticos (VIDEOS):');
  console.log(`   📁 Carpeta física: ${join(__dirname, '..', 'uploads', 'videos')}`);
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