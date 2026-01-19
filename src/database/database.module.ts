// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// ═══════════════════════════════════════════════════════════════
// 📦 ENTIDADES EXISTENTES
// ═══════════════════════════════════════════════════════════════
import { Product } from '../modules/products/entities/product.entity';
import { Kiosco } from '../modules/kioscos/entities/kiosco.entity';
import { Consulta } from '../modules/queries/entities/consulta.entity';
import { Video } from '../modules/videos/entities/video.entity';

// ═══════════════════════════════════════════════════════════════
// 🆕 ENTIDADES DEL SISTEMA DE LICENCIAS
// ═══════════════════════════════════════════════════════════════
import { AdminUser } from '../modules/auth/entities/admin-user.entity';
import { Client } from '../modules/clients/entities/client.entity';
import { Branch } from '../modules/clients/entities/branch.entity';
import { License } from '../modules/licenses/entities/license.entity';
import { Device } from '../modules/licenses/entities/device.entity';
import { DeviceLicense } from '../modules/licenses/entities/device-license.entity';
import { LicenseAuditLog } from '../modules/licenses/entities/license-audit-log.entity';
import { BlacklistedFingerprint } from '../modules/licenses/entities/blacklisted-fingerprint.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: Number(configService.get<number>('DB_PORT', 5432)),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE', 'kiosko_db'),
        
        // ═══════════════════════════════════════════════════════════════
        // 📋 TODAS LAS ENTIDADES (12 en total)
        // ═══════════════════════════════════════════════════════════════
        entities: [
          // Entidades originales (4)
          Product,
          Kiosco,
          Consulta,
          Video,
          
          // Entidades del sistema de licencias (8)
          AdminUser,
          Client,
          Branch,
          License,
          Device,
          DeviceLicense,
          LicenseAuditLog,
          BlacklistedFingerprint,
        ],
        
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', true),
        logging: configService.get<boolean>('DB_LOGGING', false),

        extra: {
          max: 20,
          min: 5,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },

        cache: {
          duration: 30000,
        },
      }),
    }),
  ],
})
export class DatabaseModule {}