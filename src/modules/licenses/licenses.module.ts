// src/modules/licenses/licenses.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LicensesController } from './licenses.controller';
import { LicensesService } from './services/licenses.service';
import { ActivationService } from './services/activation.service';
import { DevicesService } from './services/devices.service';
import { FingerprintService } from './services/fingerprint.service';
import { AuditService } from './services/audit.service';
import { License } from './entities/license.entity';
import { Device } from './entities/device.entity';
import { DeviceLicense } from './entities/device-license.entity';
import { LicenseAuditLog } from './entities/license-audit-log.entity';
import { BlacklistedFingerprint } from './entities/blacklisted-fingerprint.entity';
import { Client } from '../clients/entities/client.entity';
import { Branch } from '../clients/entities/branch.entity';
import { getJwtConfig } from '../../config/jwt.config';
import { KioscosModule } from '../kioscos/kioscos.module'; // ✅ YA ESTABA

@Module({
  imports: [
    // TypeORM entities
    TypeOrmModule.forFeature([
      License,
      Device,
      DeviceLicense,
      LicenseAuditLog,
      BlacklistedFingerprint,
      Client,
      Branch,
      // ❌ NO agregamos Kiosco aquí - usamos KioscosModule
    ]),

    // JWT para tokens de dispositivos
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getJwtConfig,
    }),

    // ✅ AGREGADO: Importar KioscosModule para poder usar KioscosService
    KioscosModule,
  ],
  controllers: [LicensesController],
  providers: [
    LicensesService,
    ActivationService,
    DevicesService,
    FingerprintService,
    AuditService,
  ],
  exports: [
    LicensesService,
    ActivationService,
    DevicesService,
    FingerprintService,
    AuditService,
  ],
})
export class LicensesModule {}