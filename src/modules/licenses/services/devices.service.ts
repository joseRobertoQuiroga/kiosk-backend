// src/modules/licenses/services/devices.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../entities/device.entity';
import { BlacklistedFingerprint } from '../entities/blacklisted-fingerprint.entity';
import { FingerprintService } from './fingerprint.service';
import { AuditService } from './audit.service';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(BlacklistedFingerprint)
    private readonly blacklistRepository: Repository<BlacklistedFingerprint>,
    private readonly fingerprintService: FingerprintService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Registrar o actualizar un dispositivo
   */
  async registerOrUpdate(params: {
    deviceFingerprint: string;
    deviceName?: string;
    androidId?: string;
    buildBoard?: string;
    buildBrand?: string;
    buildModel?: string;
    buildManufacturer?: string;
    androidVersion?: string;
    macAddressHash?: string;
    appSignatureHash?: string;
    isRooted?: boolean;
    isEmulator?: boolean;
    ipAddress?: string;
  }): Promise<Device> {
    // Validar fingerprint
    this.fingerprintService.verifyFingerprint(params.deviceFingerprint);

    // Verificar si ya existe
    let device = await this.deviceRepository.findOne({
      where: { device_fingerprint: params.deviceFingerprint },
    });

    if (device) {
      // Actualizar información
      Object.assign(device, {
        device_name: params.deviceName || device.device_name,
        android_id: params.androidId || device.android_id,
        build_board: params.buildBoard || device.build_board,
        build_brand: params.buildBrand || device.build_brand,
        build_model: params.buildModel || device.build_model,
        build_manufacturer: params.buildManufacturer || device.build_manufacturer,
        android_version: params.androidVersion || device.android_version,
        mac_address_hash: params.macAddressHash || device.mac_address_hash,
        app_signature_hash: params.appSignatureHash || device.app_signature_hash,
        is_rooted: params.isRooted ?? device.is_rooted,
        is_emulator: params.isEmulator ?? device.is_emulator,
      });

      device.updateLastSeen(params.ipAddress);
    } else {
      // Crear nuevo dispositivo
      device = this.deviceRepository.create({
        device_fingerprint: params.deviceFingerprint,
        device_name: params.deviceName,
        android_id: params.androidId,
        build_board: params.buildBoard,
        build_brand: params.buildBrand,
        build_model: params.buildModel,
        build_manufacturer: params.buildManufacturer,
        android_version: params.androidVersion,
        mac_address_hash: params.macAddressHash,
        app_signature_hash: params.appSignatureHash,
        is_rooted: params.isRooted || false,
        is_emulator: params.isEmulator || false,
        first_seen_at: new Date(),
        last_ip_address: params.ipAddress,
      });

      console.log(
        `📱 Nuevo dispositivo registrado: ${params.deviceFingerprint.substring(0, 16)}...`,
      );
    }

    return await this.deviceRepository.save(device);
  }

  /**
   * Obtener dispositivo por fingerprint
   */
  async findByFingerprint(fingerprint: string): Promise<Device | null> {
    return await this.deviceRepository.findOne({
      where: { device_fingerprint: fingerprint },
      relations: ['license_bindings', 'license_bindings.license'],
    });
  }

  /**
   * Obtener dispositivo por ID
   */
  async findOne(id: string): Promise<Device> {
    const device = await this.deviceRepository.findOne({
      where: { id },
      relations: ['license_bindings', 'license_bindings.license'],
    });

    if (!device) {
      throw new NotFoundException(`Dispositivo con ID ${id} no encontrado`);
    }

    return device;
  }

  /**
   * Verificar si un dispositivo está en la blacklist
   */
  async isBlacklisted(fingerprint: string): Promise<boolean> {
    const blacklisted = await this.blacklistRepository.findOne({
      where: { device_fingerprint: fingerprint },
    });

    return blacklisted ? blacklisted.isActive() : false;
  }

  /**
   * Agregar dispositivo a la blacklist
   */
  async blacklist(
    deviceFingerprint: string,
    reason: string,
    blockedBy: string,
    permanent: boolean = false,
  ): Promise<void> {
    // Verificar si ya está en blacklist
    let blacklisted = await this.blacklistRepository.findOne({
      where: { device_fingerprint: deviceFingerprint },
    });

    if (blacklisted) {
      // Actualizar
      blacklisted.reason = reason;
      blacklisted.blocked_by = blockedBy;
      blacklisted.incrementViolations();
      if (permanent) {
        blacklisted.makePermanent();
      }
    } else {
      // Crear nuevo
      blacklisted = this.blacklistRepository.create({
        device_fingerprint: deviceFingerprint,
        reason,
        blocked_by: blockedBy,
        is_permanent: permanent,
        blocked_at: new Date(),
      });
    }

    await this.blacklistRepository.save(blacklisted);

    // Marcar el dispositivo como blacklisted si existe
    const device = await this.findByFingerprint(deviceFingerprint);
    if (device) {
      device.blacklist(reason);
      await this.deviceRepository.save(device);

      // Registrar en auditoría
      await this.auditService.logDeviceBlacklisted(device.id, reason, blockedBy);
    }

    console.log(`🚫 Dispositivo bloqueado: ${deviceFingerprint.substring(0, 16)}...`);
  }

  /**
   * Remover dispositivo de la blacklist
   */
  async unblacklist(deviceFingerprint: string): Promise<void> {
    const blacklisted = await this.blacklistRepository.findOne({
      where: { device_fingerprint: deviceFingerprint },
    });

    if (blacklisted) {
      await this.blacklistRepository.remove(blacklisted);
    }

    // Desmarcar el dispositivo
    const device = await this.findByFingerprint(deviceFingerprint);
    if (device) {
      device.unblacklist();
      await this.deviceRepository.save(device);
    }

    console.log(`✅ Dispositivo desbloqueado: ${deviceFingerprint.substring(0, 16)}...`);
  }

  /**
   * Validar si un dispositivo puede activar licencias
   */
  async canActivate(fingerprint: string): Promise<{
    canActivate: boolean;
    reason?: string;
  }> {
    // Verificar blacklist
    const isBlacklisted = await this.isBlacklisted(fingerprint);
    if (isBlacklisted) {
      return {
        canActivate: false,
        reason: 'Dispositivo bloqueado por el administrador',
      };
    }

    // Verificar dispositivo
    const device = await this.findByFingerprint(fingerprint);
    if (device) {
      if (device.is_rooted) {
        return {
          canActivate: false,
          reason: 'Dispositivo rooteado detectado',
        };
      }

      if (device.is_emulator) {
        return {
          canActivate: false,
          reason: 'Emulador detectado',
        };
      }

      if (!device.canActivate()) {
        return {
          canActivate: false,
          reason: 'Dispositivo no autorizado',
        };
      }
    }

    return { canActivate: true };
  }

  /**
   * Obtener todos los dispositivos
   */
  async findAll(): Promise<Device[]> {
    return await this.deviceRepository.find({
      relations: ['license_bindings', 'license_bindings.license'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Obtener dispositivos bloqueados
   */
  async findBlacklisted(): Promise<BlacklistedFingerprint[]> {
    return await this.blacklistRepository.find({
      order: { blocked_at: 'DESC' },
    });
  }

  /**
   * Buscar dispositivos
   */
  async search(query: string): Promise<Device[]> {
    return await this.deviceRepository
      .createQueryBuilder('device')
      .where('device.device_name LIKE :query', { query: `%${query}%` })
      .orWhere('device.device_fingerprint LIKE :query', { query: `%${query}%` })
      .orWhere('device.build_model LIKE :query', { query: `%${query}%` })
      .orderBy('device.last_seen_at', 'DESC')
      .take(50)
      .getMany();
  }

  /**
   * Incrementar contador de activaciones
   */
  async incrementActivations(
    deviceId: string,
    success: boolean,
  ): Promise<void> {
    const device = await this.findOne(deviceId);
    device.incrementActivations(success);
    await this.deviceRepository.save(device);
  }
}