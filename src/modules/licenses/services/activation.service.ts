// src/modules/licenses/services/activation.service.ts
import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DeviceLicense } from '../entities/device-license.entity';
import { License, LicenseStatus } from '../entities/license.entity';
import { Kiosco } from '../../kioscos/entities/kiosco.entity';
import { LicensesService } from './licenses.service';
import { DevicesService } from './devices.service';
import { FingerprintService } from './fingerprint.service';
import { AuditService } from './audit.service';
import { KioscosService } from '../../kioscos/kioscos.service'; // ✅ AGREGADO
import { AuditSeverity } from '../entities/license-audit-log.entity';
import { LicenseJwtPayload } from '../../../config/jwt.config';
import {
  ActivateDeviceDto,
  ActivateDeviceResponseDto,
  ActivateDeviceErrorDto,
} from '../dto/activate-divice.dto';
import {
  ValidateLicenseDto,
  ValidateLicenseResponseDto,
  ValidateLicenseErrorDto,
} from '../dto/validate-license.dto';
import {
  HeartbeatDto,
  HeartbeatResponseDto,
  HeartbeatErrorDto,
} from '../dto/heartbeat.dto';

@Injectable()
export class ActivationService {
  constructor(
    @InjectRepository(DeviceLicense)
    private readonly deviceLicenseRepository: Repository<DeviceLicense>,
    @InjectRepository(License)
    private readonly licenseRepository: Repository<License>,
    // ❌ ELIMINADO: @InjectRepository(Kiosco) private readonly kioscoRepository
    private readonly kioscosService: KioscosService, // ✅ AGREGADO
    private readonly licensesService: LicensesService,
    private readonly devicesService: DevicesService,
    private readonly fingerprintService: FingerprintService,
    private readonly auditService: AuditService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 🔐 ACTIVAR DISPOSITIVO CON LICENCIA (1-a-1 ESTRICTO)
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  async activateDevice(
    activateDto: ActivateDeviceDto,
    ipAddress: string,
  ): Promise<ActivateDeviceResponseDto | ActivateDeviceErrorDto> {
    const { license_key, device_fingerprint, kiosco_id } = activateDto;

    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔐 INICIO DE ACTIVACIÓN');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('License Key:', license_key);
      console.log('Fingerprint:', device_fingerprint.substring(0, 16) + '...');
      console.log('Kiosco ID:', kiosco_id || '(ninguno)');
      console.log('IP:', ipAddress);

      // ═══════════════════════════════════════════════════════════════
      // 1️⃣ VALIDAR FINGERPRINT
      // ═══════════════════════════════════════════════════════════════
      this.fingerprintService.verifyFingerprint(device_fingerprint);

      const suspiciousCheck = this.fingerprintService.detectSuspiciousFingerprint(
        device_fingerprint,
      );

      if (suspiciousCheck.suspicious) {
        await this.auditService.logEvent({
          eventType: 'activation_failed' as any,
          severity: AuditSeverity.WARNING,
          message: `Fingerprint sospechoso: ${suspiciousCheck.reasons.join(', ')}`,
          ipAddress,
          eventData: { device_fingerprint, license_key, reasons: suspiciousCheck.reasons },
        });

        return {
          success: false,
          error: 'Fingerprint de dispositivo sospechoso o inválido',
          error_code: 'SUSPICIOUS_FINGERPRINT',
          details: suspiciousCheck.reasons,
        };
      }

      // ═══════════════════════════════════════════════════════════════
      // 2️⃣ VALIDAR KIOSCO (SI SE PROPORCIONÓ)
      // ═══════════════════════════════════════════════════════════════
      let kiosco: Kiosco | null = null;

      if (kiosco_id) {
        console.log('🔍 Validando kiosco:', kiosco_id);

        // ✅ CORREGIDO: Usar servicio en lugar de repositorio
        try {
          kiosco = await this.kioscosService.findOne(kiosco_id);
        } catch (error) {
          await this.auditService.logEvent({
            eventType: 'activation_failed' as any,
            severity: AuditSeverity.WARNING,
            message: `Kiosco no encontrado: ${kiosco_id}`,
            ipAddress,
            eventData: { device_fingerprint, license_key, kiosco_id },
          });

          return {
            success: false,
            error: `Kiosco con ID ${kiosco_id} no existe en el sistema`,
            error_code: 'KIOSCO_NOT_FOUND',
          };
        }

        if (!kiosco.activo) {
          await this.auditService.logEvent({
            eventType: 'activation_failed' as any,
            severity: AuditSeverity.WARNING,
            message: `Kiosco inactivo: ${kiosco.nombre}`,
            ipAddress,
            eventData: { device_fingerprint, license_key, kiosco_id },
          });

          return {
            success: false,
            error: `El kiosco "${kiosco.nombre}" está desactivado. Contacta al administrador.`,
            error_code: 'KIOSCO_INACTIVE',
          };
        }

        console.log(`✅ Kiosco válido: ${kiosco.nombre} (${kiosco.ubicacion})`);
      }

      // ═══════════════════════════════════════════════════════════════
      // 3️⃣ BUSCAR Y VALIDAR LICENCIA
      // ═══════════════════════════════════════════════════════════════
      console.log('🔍 Buscando licencia...');
      
      const license = await this.licensesService.findByKey(license_key);
      
      if (!license) {
        await this.auditService.logActivationFailed(
          license_key,
          device_fingerprint,
          'Licencia no encontrada',
          ipAddress,
        );

        return {
          success: false,
          error: 'Licencia no encontrada',
          error_code: 'LICENSE_NOT_FOUND',
        };
      }

      console.log(`✅ Licencia encontrada: ${license.license_key}`);

      // ═══════════════════════════════════════════════════════════════
      // 4️⃣ VALIDAR ESTADO DE LA LICENCIA
      // ═══════════════════════════════════════════════════════════════
      const validationResult = this.licensesService.isLicenseValid(license);
      
      if (!validationResult.valid) {
        await this.auditService.logActivationFailed(
          license_key,
          device_fingerprint,
          validationResult.reason!,
          ipAddress,
        );

        return {
          success: false,
          error: validationResult.reason!,
          error_code: 'LICENSE_INVALID',
        };
      }

      console.log('✅ Licencia válida');

      // ═══════════════════════════════════════════════════════════════
      // 5️⃣ VERIFICAR BINDING EXISTENTE (REGLA 1-A-1)
      // ═══════════════════════════════════════════════════════════════
      console.log('🔍 Verificando bindings existentes...');

      const existingBinding = await this.deviceLicenseRepository.findOne({
        where: {
          license_id: license.id,
          is_active: true,
        },
        relations: ['device'],
      });

      if (existingBinding) {
        console.log('⚠️  Binding existente encontrado');

        // ✅ CASO 1: MISMO DISPOSITIVO (Reactivación o actualización)
        if (existingBinding.device.device_fingerprint === device_fingerprint) {
          console.log('✅ Mismo dispositivo, actualizando información...');

          // 🔄 ACTUALIZAR KIOSCO SI CAMBIÓ
          if (kiosco_id && existingBinding.kiosco_id !== kiosco_id) {
            console.log(`🔄 Cambiando kiosco: ${existingBinding.kiosco_id} → ${kiosco_id}`);
            
            existingBinding.updateKiosco(kiosco);
            await this.deviceLicenseRepository.save(existingBinding);

            await this.auditService.logEvent({
              eventType: 'kiosco_updated' as any,
              severity: AuditSeverity.INFO,
              message: `Kiosco actualizado de "${existingBinding.kiosco_name}" a "${kiosco?.nombre}"`,
              licenseId: license.id,
              deviceId: existingBinding.device_id,
              ipAddress,
              eventData: {
                old_kiosco_id: existingBinding.kiosco_id,
                new_kiosco_id: kiosco_id,
              },
            });
          }

          return await this.buildSuccessResponse(existingBinding, license, kiosco);
        }

        // ❌ CASO 2: OTRO DISPOSITIVO (INTENTO DE CLONACIÓN)
        console.error('🚨 INTENTO DE CLONACIÓN DETECTADO');

        await this.auditService.logCloningAttempt(
          license.id,
          existingBinding.device.id,
          ipAddress,
          {
            original_device: existingBinding.device.device_fingerprint,
            cloning_attempt_device: device_fingerprint,
            license_key,
            kiosco_id,
          },
        );

        return {
          success: false,
          error: 'Esta licencia ya está activada en otro dispositivo',
          error_code: 'LICENSE_ALREADY_BOUND',
          details: {
            message:
              'La licencia está en uso en otro dispositivo. ' +
              'Contacta al administrador para transferir la licencia.',
            original_device: existingBinding.device.device_name || 'Desconocido',
            activated_at: existingBinding.activated_at,
          },
        };
      }

      console.log('✅ No hay bindings existentes, procediendo...');

      // ═══════════════════════════════════════════════════════════════
      // 6️⃣ VERIFICAR QUE EL DISPOSITIVO NO TENGA OTRA LICENCIA ACTIVA
      // ═══════════════════════════════════════════════════════════════
      const existingDevice = await this.devicesService.findByFingerprint(device_fingerprint);
      
      if (existingDevice) {
        const deviceWithOtherLicense = await this.deviceLicenseRepository.findOne({
          where: {
            device_id: existingDevice.id,
            is_active: true,
          },
          relations: ['license'],
        });

        if (deviceWithOtherLicense) {
          console.error('❌ Dispositivo ya tiene otra licencia activa');

          return {
            success: false,
            error: 'Este dispositivo ya tiene una licencia activa diferente',
            error_code: 'DEVICE_ALREADY_BOUND',
            details: {
              message: 'Desactiva la licencia actual antes de activar una nueva',
              current_license: deviceWithOtherLicense.license.license_key,
            },
          };
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // 7️⃣ VALIDAR CAPACIDAD DEL DISPOSITIVO
      // ═══════════════════════════════════════════════════════════════
      console.log('🔍 Validando dispositivo...');

      const canActivate = await this.devicesService.canActivate(device_fingerprint);
      
      if (!canActivate.canActivate) {
        await this.auditService.logActivationFailed(
          license_key,
          device_fingerprint,
          canActivate.reason!,
          ipAddress,
        );

        return {
          success: false,
          error: canActivate.reason!,
          error_code: 'DEVICE_NOT_ALLOWED',
        };
      }

      // ═══════════════════════════════════════════════════════════════
      // 8️⃣ REGISTRAR/ACTUALIZAR DISPOSITIVO
      // ═══════════════════════════════════════════════════════════════
      console.log('📱 Registrando dispositivo...');

      const device = await this.devicesService.registerOrUpdate({
        deviceFingerprint: device_fingerprint,
        deviceName: activateDto.device_name,
        androidId: activateDto.android_id,
        buildBoard: activateDto.build_board,
        buildBrand: activateDto.build_brand,
        buildModel: activateDto.build_model,
        buildManufacturer: activateDto.build_manufacturer,
        androidVersion: activateDto.android_version,
        macAddressHash: activateDto.mac_address_hash,
        appSignatureHash: activateDto.app_signature_hash,
        isRooted: activateDto.is_rooted,
        isEmulator: activateDto.is_emulator,
        ipAddress,
      });

      console.log(`✅ Dispositivo registrado: ${device.id}`);

      // ═══════════════════════════════════════════════════════════════
      // 9️⃣ ALERTAS DE SEGURIDAD
      // ═══════════════════════════════════════════════════════════════
      if (device.is_rooted) {
        await this.auditService.logRootedDevice(device.id, device_fingerprint, ipAddress);
      }
      
      if (device.is_emulator) {
        await this.auditService.logEmulatorDetected(device.id, device_fingerprint, ipAddress);
      }

      
    // ═══════════════════════════════════════════════════════════════
// 🔟 CREAR BINDING LICENCIA-DISPOSITIVO
// ═══════════════════════════════════════════════════════════════
console.log('🔗 Creando binding...');

const activationCode = this.fingerprintService.generateActivationCode();
const jwtToken = await this.generateDeviceJWT(license, device.id, device_fingerprint);

// ✅ CORRECCIÓN: Solo pasar los objetos de relación, NO los IDs directamente
const deviceLicense = this.deviceLicenseRepository.create({
  license: license,                    // TypeORM extraerá license_id automáticamente
  device: device,                      // TypeORM extraerá device_id automáticamente
  kiosco_id: kiosco?.id || null,
  kiosco_name: kiosco?.nombre || null,
  kiosco_location: kiosco?.ubicacion || null,
  is_active: true,
  activated_at: new Date(),
  activation_code: activationCode,
  jwt_token: jwtToken,
  jwt_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  activation_ip: ipAddress,
  last_seen_ip: ipAddress,
});

const savedBinding = await this.deviceLicenseRepository.save(deviceLicense);

console.log(`✅ Binding creado: ${savedBinding.id}`);

// ✅ NUEVO: RECARGAR BINDING CON TODAS LAS RELACIONES
const bindingWithRelations = await this.deviceLicenseRepository.findOne({
  where: { id: savedBinding.id },
  relations: ['license', 'license.client', 'license.branch', 'device'],
});

if (!bindingWithRelations) {
  throw new Error('Error al recargar binding con relaciones');
}

// ═══════════════════════════════════════════════════════════════
// 1️⃣1️⃣ ACTUALIZAR LICENCIA
// ═══════════════════════════════════════════════════════════════
if (license.status === LicenseStatus.PENDING) {
  license.status = LicenseStatus.ACTIVE;
  license.first_activated_at = new Date();
}

license.last_validated_at = new Date();
await this.licenseRepository.save(license);

// ═══════════════════════════════════════════════════════════════
// 1️⃣2️⃣ ACTUALIZAR ESTADÍSTICAS
// ═══════════════════════════════════════════════════════════════
await this.devicesService.incrementActivations(device.id, true);

// ═══════════════════════════════════════════════════════════════
// 1️⃣3️⃣ REGISTRAR EN AUDITORÍA
// ═══════════════════════════════════════════════════════════════
await this.auditService.logLicenseActivated(license.id, device.id, ipAddress);

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ ACTIVACIÓN EXITOSA');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Licencia:', license_key);
console.log('Dispositivo:', device_fingerprint.substring(0, 16) + '...');
console.log('Kiosco:', kiosco?.nombre || '(ninguno)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

// ✅ USAR EL BINDING CON RELACIONES
return await this.buildSuccessResponse(bindingWithRelations, license, kiosco);

    } catch (error) {
      console.error('❌ ERROR EN ACTIVACIÓN:', error);
      throw error;
    }
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * ✅ VALIDAR LICENCIA (Al arranque de la app)
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  async validateLicense(
    validateDto: ValidateLicenseDto,
    ipAddress: string,
  ): Promise<ValidateLicenseResponseDto | ValidateLicenseErrorDto> {
    const { device_fingerprint, activation_code } = validateDto;

    try {
      const binding = await this.deviceLicenseRepository.findOne({
        where: {
          activation_code,
          is_active: true,
        },
        relations: ['license', 'license.client', 'license.branch', 'device', 'kiosco'],
      });

      if (!binding) {
        return {
          valid: false,
          error: 'Código de activación inválido o licencia desactivada',
          error_code: 'INVALID_ACTIVATION_CODE',
          action_required: 'reactivate',
        };
      }

      // 🔥 VALIDACIÓN CRÍTICA: FINGERPRINT DEBE COINCIDIR
      if (binding.device.device_fingerprint !== device_fingerprint) {
        await this.auditService.logCloningAttempt(
          binding.license.id,
          binding.device.id,
          ipAddress,
          {
            expected_fingerprint: binding.device.device_fingerprint,
            received_fingerprint: device_fingerprint,
          },
        );

        return {
          valid: false,
          error: 'Dispositivo no autorizado - fingerprint no coincide',
          error_code: 'DEVICE_MISMATCH',
          action_required: 'contact_admin',
        };
      }

      // Validar estado de la licencia
      const validationResult = this.licensesService.isLicenseValid(binding.license);
      
      if (!validationResult.valid && !validationResult.isInGracePeriod) {
        return {
          valid: false,
          error: validationResult.reason!,
          error_code: 'LICENSE_EXPIRED',
          action_required: 'renew',
        };
      }

      // Actualizar último acceso
      binding.device.updateLastSeen(ipAddress);
      await this.deviceLicenseRepository.manager.save(binding.device);

      const daysRemaining = this.licensesService.getDaysRemaining(binding.license);

      return {
        valid: true,
        message: 'Licencia válida',
        license: {
          id: binding.license.id,
          license_key: binding.license.license_key,
          type: binding.license.type,
          status: binding.license.status,
          expiry_date: binding.license.expiry_date,
          days_remaining: daysRemaining,
          is_in_grace_period: validationResult.isInGracePeriod || false,
        },
        device: {
          id: binding.device.id,
          device_fingerprint: binding.device.device_fingerprint,
          device_name: binding.device.device_name,
        },
        client: {
          id: binding.license.client.id,
          name: binding.license.client.name,
        },
        branch: {
          id: binding.license.branch.id,
          name: binding.license.branch.name,
        },
        kiosco: binding.kiosco ? {
          id: binding.kiosco.id,
          nombre: binding.kiosco.nombre,
          ubicacion: binding.kiosco.ubicacion,
          activo: binding.kiosco.activo,
        } : null,
      };
    } catch (error) {
      console.error('❌ Error al validar licencia:', error);
      throw error;
    }
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 💓 HEARTBEAT (Cada 5 minutos desde APK)
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  async heartbeat(
    heartbeatDto: HeartbeatDto,
    ipAddress: string,
  ): Promise<HeartbeatResponseDto | HeartbeatErrorDto> {
    const { device_fingerprint, activation_code } = heartbeatDto;

    try {
      const binding = await this.deviceLicenseRepository.findOne({
        where: { activation_code, is_active: true },
        relations: ['license', 'device', 'kiosco'],
      });

      if (!binding) {
        return {
          success: false,
          error: 'Activación no encontrada o desactivada',
          error_code: 'NOT_ACTIVATED',
          action_required: 'stop_operation',
        };
      }

      // 🔥 VALIDAR FINGERPRINT
      if (binding.device.device_fingerprint !== device_fingerprint) {
        await this.auditService.logCloningAttempt(
          binding.license.id,
          binding.device.id,
          ipAddress,
          {
            expected_fingerprint: binding.device.device_fingerprint,
            received_fingerprint: device_fingerprint,
          },
        );

        return {
          success: false,
          error: 'Dispositivo no autorizado',
          error_code: 'DEVICE_MISMATCH',
          action_required: 'stop_operation',
        };
      }

      // 🔥 VALIDAR QUE EL KIOSCO SIGA ACTIVO
      if (binding.kiosco_id && binding.kiosco) {
        if (!binding.kiosco.activo) {
          return {
            success: false,
            error: `El kiosco "${binding.kiosco.nombre}" ha sido desactivado`,
            error_code: 'KIOSCO_INACTIVE',
            action_required: 'stop_operation',
          };
        }
      }

      // Validar licencia
      const validationResult = this.licensesService.isLicenseValid(binding.license);
      
      if (!validationResult.valid && !validationResult.isInGracePeriod) {
        return {
          success: false,
          error: validationResult.reason!,
          error_code: 'LICENSE_INVALID',
          action_required: 'renew_license',
        };
      }

      // Actualizar heartbeat
      binding.updateHeartbeat(ipAddress);
      await this.deviceLicenseRepository.save(binding);

      await this.licensesService.updateLastValidated(binding.license.id);

      // Registrar en auditoría cada 10 heartbeats
      if (binding.heartbeat_count % 10 === 0) {
        await this.auditService.logHeartbeat(
          binding.license.id,
          binding.device.id,
          ipAddress,
        );
      }

      const daysRemaining = this.licensesService.getDaysRemaining(binding.license);

      const warnings: string[] = [];
      if (daysRemaining !== null) {
        if (daysRemaining <= 7 && daysRemaining > 0) {
          warnings.push(`La licencia expira en ${daysRemaining} días`);
        }
        if (validationResult.isInGracePeriod) {
          warnings.push('La licencia está en período de gracia. Renueva pronto.');
        }
      }

      return {
        success: true,
        message: 'Heartbeat recibido',
        next_heartbeat_in: this.configService.get<number>(
          'LICENSE_HEARTBEAT_INTERVAL',
          300000,
        ),
        license_status: {
          is_valid: true,
          is_expired: binding.license.isExpired(),
          is_in_grace_period: validationResult.isInGracePeriod || false,
          days_remaining: daysRemaining,
        },
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      console.error('❌ Error en heartbeat:', error);
      throw error;
    }
  }

  /**
   * Generar JWT para dispositivo
   */
  private async generateDeviceJWT(
    license: License,
    deviceId: string,
    deviceFingerprint: string,
  ): Promise<string> {
    const payload: LicenseJwtPayload = {
      sub: deviceId,
      license_id: license.id,
      device_fingerprint: deviceFingerprint,
      client_id: license.client_id,
      branch_id: license.branch_id,
      license_type: license.type,
      issued_at: new Date(),
      expires_at: license.expiry_date,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Construir respuesta de éxito
   */
  private async buildSuccessResponse(
    binding: DeviceLicense,
    license: License,
    kiosco?: Kiosco | null,
  ): Promise<ActivateDeviceResponseDto> {
    if (!license.client) {
      license = await this.licensesService.findOne(license.id);
    }

    const response: any = {
      success: true,
      message: 'Dispositivo activado exitosamente',
      activation_code: binding.activation_code,
      jwt_token: binding.jwt_token!,
      expires_at: binding.jwt_expires_at!,
      device: {
        id: binding.device_id,
        device_fingerprint: binding.device.device_fingerprint,
        device_name: binding.device.device_name,
      },
      license: {
        id: license.id,
        license_key: license.license_key,
        type: license.type,
        expiry_date: license.expiry_date,
      },
      client: {
        id: license.client.id,
        name: license.client.name,
      },
      branch: {
        id: license.branch.id,
        name: license.branch.name,
      },
    };

    if (kiosco) {
      response.kiosco = {
        id: kiosco.id,
        nombre: kiosco.nombre,
        ubicacion: kiosco.ubicacion,
      };
    }

    return response;
  }
}