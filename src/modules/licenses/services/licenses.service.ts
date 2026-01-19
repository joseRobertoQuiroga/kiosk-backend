// src/modules/licenses/services/licenses.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { License, LicenseType, LicenseStatus } from '../entities/license.entity';
import { Client } from '../../clients/entities/client.entity';
import { Branch } from '../../clients/entities/branch.entity';
import { CreateLicenseDto } from '../dto/create-license.dto';
import { LicenseConfig } from '../../../config/license.config';
import { AuditService } from './audit.service';

@Injectable()
export class LicensesService {
  private licenseConfig: LicenseConfig;

  constructor(
    @InjectRepository(License)
    private readonly licenseRepository: Repository<License>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {
    this.licenseConfig = new LicenseConfig(this.configService);
  }

  /**
   * Crear una nueva licencia
   * Solo el super admin puede crear licencias
   */
  async create(
    createLicenseDto: CreateLicenseDto,
    adminEmail: string,
  ): Promise<License> {
    const { type, client_id, branch_id, notes } = createLicenseDto;

    // Verificar que el cliente existe
    const client = await this.clientRepository.findOne({
      where: { id: client_id },
    });

    if (!client) {
      throw new NotFoundException(`Cliente con ID ${client_id} no encontrado`);
    }

    if (!client.is_active) {
      throw new BadRequestException('No se puede crear licencia para un cliente inactivo');
    }

    // Verificar que la sucursal existe y pertenece al cliente
    const branch = await this.branchRepository.findOne({
      where: { id: branch_id, client_id },
    });

    if (!branch) {
      throw new NotFoundException(
        `Sucursal con ID ${branch_id} no encontrada o no pertenece al cliente`,
      );
    }

    if (!branch.is_active) {
      throw new BadRequestException('No se puede crear licencia para una sucursal inactiva');
    }

    // Generar license key única
    let licenseKey: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      licenseKey = this.licenseConfig.generateLicenseKey();
      const existing = await this.licenseRepository.findOne({
        where: { license_key: licenseKey },
      });
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('No se pudo generar una license key única');
    }

    // Calcular fecha de expiración
    const issuedDate = new Date();
    const expiryDate = this.licenseConfig.calculateExpiryDate(type);

    // Crear licencia
    const license = this.licenseRepository.create({
      license_key: licenseKey,
      type,
      status: LicenseStatus.PENDING,
      max_devices: 1, // Siempre 1
      issued_date: issuedDate,
      expiry_date: expiryDate,
      created_by: adminEmail,
      client_id,
      branch_id,
      notes,
    });

    const savedLicense = await this.licenseRepository.save(license);

    // Registrar en auditoría
    await this.auditService.logLicenseCreated(
      savedLicense.id,
      adminEmail,
      licenseKey,
    );

    console.log(
      `✅ Licencia creada: ${licenseKey} (${type}) para ${client.name} - ${branch.name}`,
    );

    return savedLicense;
  }

  /**
   * Obtener licencia por license_key
   */
  async findByKey(licenseKey: string): Promise<License | null> {
    return await this.licenseRepository.findOne({
      where: { license_key: licenseKey },
      relations: ['client', 'branch', 'device_bindings', 'device_bindings.device'],
    });
  }

  /**
   * Obtener licencia por ID
   */
  async findOne(id: string): Promise<License> {
    const license = await this.licenseRepository.findOne({
      where: { id },
      relations: ['client', 'branch', 'device_bindings', 'device_bindings.device'],
    });

    if (!license) {
      throw new NotFoundException(`Licencia con ID ${id} no encontrada`);
    }

    return license;
  }

  /**
   * Obtener todas las licencias
   */
  async findAll(filters?: {
  status?: LicenseStatus;
  type?: LicenseType;
  clientId?: string;
  branchId?: string;
}): Promise<License[]> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 [LicensesService] findAll - Cargando licencias');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const query = this.licenseRepository
    .createQueryBuilder('license')
    // ✅ Cliente y Sucursal
    .leftJoinAndSelect('license.client', 'client')
    .leftJoinAndSelect('license.branch', 'branch')
    // ✅ Device Bindings (relación con dispositivos)
    .leftJoinAndSelect('license.device_bindings', 'binding')
    // 🔥 CRÍTICO: Cargar el dispositivo dentro del binding
    .leftJoinAndSelect('binding.device', 'device')
    .orderBy('license.created_at', 'DESC');

  // Aplicar filtros
  if (filters?.status) {
    query.andWhere('license.status = :status', { status: filters.status });
  }

  if (filters?.type) {
    query.andWhere('license.type = :type', { type: filters.type });
  }

  if (filters?.clientId) {
    query.andWhere('license.client_id = :clientId', { clientId: filters.clientId });
  }

  if (filters?.branchId) {
    query.andWhere('license.branch_id = :branchId', { branchId: filters.branchId });
  }

  const licenses = await query.getMany();

  console.log(`✅ Licencias cargadas: ${licenses.length}`);
  
  // 🔍 VERIFICAR QUE SE CARGARON LAS RELACIONES
  if (licenses.length > 0) {
    const firstLicense = licenses[0];
    console.log('📦 Primera licencia:');
    console.log('   - ID:', firstLicense.id);
    console.log('   - Cliente cargado:', !!firstLicense.client);
    console.log('   - Sucursal cargada:', !!firstLicense.branch);
    console.log('   - Bindings cargados:', firstLicense.device_bindings?.length || 0);
    
    if (firstLicense.device_bindings && firstLicense.device_bindings.length > 0) {
      const firstBinding = firstLicense.device_bindings[0];
      console.log('   - Device en binding:', !!firstBinding.device);
      
      if (firstBinding.device) {
        console.log('     → Device Name:', firstBinding.device.device_name);
        console.log('     → Build Brand:', firstBinding.device.build_brand);
        console.log('     → Build Model:', firstBinding.device.build_model);
        console.log('     → Android Version:', firstBinding.device.android_version);
      } else {
        console.warn('   ⚠️ ADVERTENCIA: Device NO cargado en el binding');
      }
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return licenses;
}
  /**
   * Revocar una licencia
   */
  async revoke(
    licenseId: string,
    reason: string,
    adminEmail: string,
  ): Promise<License> {
    const license = await this.findOne(licenseId);

    if (license.status === LicenseStatus.REVOKED) {
      throw new BadRequestException('La licencia ya está revocada');
    }

    // Revocar licencia
    license.revoke(reason, adminEmail);
    const revokedLicense = await this.licenseRepository.save(license);

    // Desactivar todos los bindings
    for (const binding of license.device_bindings) {
      if (binding.is_active) {
        binding.deactivate(`Licencia revocada: ${reason}`);
      }
    }

    // Registrar en auditoría
    await this.auditService.logLicenseRevoked(licenseId, adminEmail, reason);

    console.log(`🚫 Licencia revocada: ${license.license_key}`);

    return revokedLicense;
  }

  /**
   * Verificar si una licencia es válida
   */
  isLicenseValid(license: License): {
    valid: boolean;
    reason?: string;
    isInGracePeriod?: boolean;
  } {
    if (license.status === LicenseStatus.REVOKED) {
      return { valid: false, reason: 'Licencia revocada' };
    }

    if (license.isExpired()) {
      const graceDays = this.licenseConfig.gracePeriodDays;
      if (license.isInGracePeriod(graceDays)) {
        return {
          valid: true,
          isInGracePeriod: true,
          reason: 'Licencia en período de gracia',
        };
      }
      return { valid: false, reason: 'Licencia expirada' };
    }

    return { valid: true };
  }

  /**
   * Obtener días restantes de una licencia
   */
  getDaysRemaining(license: License): number | null {
    if (!license.expiry_date) return null; // Perpetua

    const now = new Date();
    const diff = license.expiry_date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Buscar licencias
   */
  async search(query: string): Promise<License[]> {
    return await this.licenseRepository
      .createQueryBuilder('license')
      .leftJoinAndSelect('license.client', 'client')
      .leftJoinAndSelect('license.branch', 'branch')
      .where('license.license_key LIKE :query', { query: `%${query}%` })
      .orWhere('client.name LIKE :query', { query: `%${query}%` })
      .orWhere('branch.name LIKE :query', { query: `%${query}%` })
      .orderBy('license.created_at', 'DESC')
      .take(50)
      .getMany();
  }

  /**
   * Obtener estadísticas generales de licencias
   */
  async getStats(): Promise<any> {
    const total = await this.licenseRepository.count();
    const active = await this.licenseRepository.count({
      where: { status: LicenseStatus.ACTIVE },
    });
    const expired = await this.licenseRepository.count({
      where: { status: LicenseStatus.EXPIRED },
    });
    const revoked = await this.licenseRepository.count({
      where: { status: LicenseStatus.REVOKED },
    });
    const pending = await this.licenseRepository.count({
      where: { status: LicenseStatus.PENDING },
    });

    const byType = {
      trial: await this.licenseRepository.count({ where: { type: LicenseType.TRIAL } }),
      annual: await this.licenseRepository.count({ where: { type: LicenseType.ANNUAL } }),
      perpetual: await this.licenseRepository.count({
        where: { type: LicenseType.PERPETUAL },
      }),
    };

    return {
      total,
      by_status: { active, expired, revoked, pending },
      by_type: byType,
    };
  }

  /**
   * Actualizar última validación
   */
  async updateLastValidated(licenseId: string): Promise<void> {
    await this.licenseRepository.update(licenseId, {
      last_validated_at: new Date(),
    });
  }
}