// src/app.module.ts - ACTUALIZADO CON SISTEMA DE LICENCIAS
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// ═══════════════════════════════════════════════════════════════
// 🔥 DATABASE MODULE
// ═══════════════════════════════════════════════════════════════
import { DatabaseModule } from './database/database.module';

// ═══════════════════════════════════════════════════════════════
// 📦 MÓDULOS ORIGINALES DE LA APLICACIÓN
// ═══════════════════════════════════════════════════════════════
import { ProductsModule } from './modules/products/products.module';
import { QueriesModule } from './modules/queries/queries.module';
import { AdminModule } from './modules/admin/admin.module';
import { KioscosModule } from './modules/kioscos/kioscos.module';
import { VideosModule } from './modules/videos/videos.module';

// ═══════════════════════════════════════════════════════════════
// 🆕 MÓDULOS DEL SISTEMA DE LICENCIAS
// ═══════════════════════════════════════════════════════════════
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { LicensesModule } from './modules/licenses/licenses.module';

// ═══════════════════════════════════════════════════════════════
// 🔒 GUARDS GLOBALES
// ═══════════════════════════════════════════════════════════════
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { GlobalAuthGuard } from './common/guards/global-auth.guard';

@Module({
  imports: [
    // ═══════════════════════════════════════════════════════════════
    // 🔧 CONFIGURACIÓN GLOBAL CON VARIABLES DE ENTORNO
    // ═══════════════════════════════════════════════════════════════
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true, // Cachear variables de entorno para mejor performance
    }),

    // ═══════════════════════════════════════════════════════════════
    // 🔥 DATABASE MODULE - POSTGRESQL CON TYPEORM
    // ═══════════════════════════════════════════════════════════════
    DatabaseModule,

    // ═══════════════════════════════════════════════════════════════
    // 🔐 MÓDULOS DEL SISTEMA DE LICENCIAS (NUEVO)
    // ═══════════════════════════════════════════════════════════════
    AuthModule,      // Autenticación JWT del super admin
    ClientsModule,   // Gestión de clientes y sucursales
    LicensesModule,  // Sistema de licencias, dispositivos y activación

    // ═══════════════════════════════════════════════════════════════
    // 📦 MÓDULOS ORIGINALES DE LA APLICACIÓN
    // ═══════════════════════════════════════════════════════════════
    ProductsModule,
    QueriesModule,
    VideosModule,
    AdminModule,
    KioscosModule,
  ],
  
  controllers: [AppController],
  providers: [
    AppService,
    
    // ═══════════════════════════════════════════════════════════════
    // 🔒 GUARD GLOBAL DE AUTENTICACIÓN JWT
    // ═══════════════════════════════════════════════════════════════
    // IMPORTANTE: Este guard protege TODOS los endpoints por defecto
    // Los endpoints que deben ser públicos usan el decorador @Public()
    {
      provide: APP_GUARD,
     useClass: GlobalAuthGuard,
    },
  ],
})
export class AppModule {
  constructor() {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 KIOSCO API - SISTEMA DE LICENCIAMIENTO INICIADO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📦 Módulos cargados:');
    console.log('   ✅ DatabaseModule (PostgreSQL + TypeORM)');
    console.log('   ✅ AuthModule (JWT + Super Admin)');
    console.log('   ✅ ClientsModule (Clientes y Sucursales)');
    console.log('   ✅ LicensesModule (Licencias, Dispositivos, Activación)');
    console.log('   ✅ ProductsModule');
    console.log('   ✅ QueriesModule');
    console.log('   ✅ VideosModule');
    console.log('   ✅ AdminModule');
    console.log('   ✅ KioscosModule');
    console.log('');
    console.log('🔐 Seguridad:');
    console.log('   ✅ JWT Auth Guard aplicado globalmente');
    console.log('   ✅ Endpoints públicos: /api/licenses/activate, /validate, /heartbeat');
    console.log('   ✅ Endpoints protegidos: Requieren token JWT de super admin');
    console.log('');
    console.log('🌐 Endpoints disponibles:');
    console.log('   🔓 POST /api/auth/login');
    console.log('   🔓 POST /api/licenses/activate');
    console.log('   🔓 POST /api/licenses/validate');
    console.log('   🔓 POST /api/licenses/heartbeat');
    console.log('   🔒 GET  /api/licenses (+ 20 más endpoints protegidos)');
    console.log('   🔒 GET  /api/clients');
    console.log('   🔒 GET  /api/branches');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  }
}