// src/modules/licenses/licenses.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { LicensesService } from './services/licenses.service';
import { ActivationService } from './services/activation.service';
import { DevicesService } from './services/devices.service';
import { AuditService } from './services/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { CreateLicenseDto } from './dto/create-license.dto';
import { ActivateDeviceDto } from './dto/activate-divice.dto';
import { ValidateLicenseDto } from './dto/validate-license.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { RevokeLicenseDto } from './dto/revoke-license.dto';
import { LicenseStatus, LicenseType } from './entities/license.entity';
import { License } from './entities/license.entity';

/**
 * ═══════════════════════════════════════════════════════════════
 * 🔄 INTERFACES PARA EL DASHBOARD
 * ═══════════════════════════════════════════════════════════════
 */

interface DashboardDevice {
  id: string;
  license_id: string;
  device_fingerprint: string;
  device_name?: string;
  device_model?: string;
  os_version?: string;
  app_version?: string;
  ip_address?: string;
  is_active: boolean;
  is_blacklisted: boolean;
  last_heartbeat?: string;
  activated_at: string;
}

interface DashboardLicense {
  id: string;
  license_key: string;
  license_type: 'trial' | 'monthly' | 'annual' | 'perpetual';
  status: 'active' | 'inactive' | 'expired' | 'revoked' | 'suspended' | 'pending';
  max_activations: number;
  current_activations: number;
  client?: {
    id: string;
    company_name: string;
  };
  branch?: {
    id: string;
    branch_name: string;
  };
  issued_at: string;
  expires_at?: string;
  created_at: string;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * 🔧 FUNCIÓN DE TRANSFORMACIÓN PARA EL DASHBOARD
 * ═══════════════════════════════════════════════════════════════
 */
function transformLicenseForDashboard(license: License): DashboardLicense {
  // 🔥 CALCULAR ACTIVACIONES ACTUALES
  const activeBindings = license.device_bindings?.filter(b => b.is_active) || [];
  const currentActivations = activeBindings.length;

  // 🔥 NORMALIZAR STATUS
  let status: any = license.status?.toLowerCase().trim();
  
  // Mapeo de estados
  if (status === 'pending' && currentActivations > 0) {
    status = 'active'; // ✅ Si tiene dispositivos activos, está "active"
  } else if (status === 'pending' && currentActivations === 0) {
    status = 'inactive'; // ⚠️ Pendiente sin activar
  } else if (status === 'grace_period') {
    status = 'active'; // 🕐 Periodo de gracia = aún activa
  }

  // 🔥 NORMALIZAR TIPO
  let licenseType: any = license.type?.toLowerCase().trim() || 'trial';
  
  // Validar que sea un tipo válido
  const validTypes = ['trial', 'monthly', 'annual', 'perpetual'];
  if (!validTypes.includes(licenseType)) {
    console.warn(`⚠️ Tipo de licencia inválido: "${license.type}" → usando "trial"`);
    licenseType = 'trial';
  }

  // 🔥 TRANSFORMAR CLIENTE Y SUCURSAL
  const client = license.client ? {
    id: license.client.id,
    company_name: license.client.name,
  } : undefined;

  const branch = license.branch ? {
    id: license.branch.id,
    branch_name: license.branch.name,
  } : undefined;

  return {
    id: license.id,
    license_key: license.license_key,
    
    // ✅ CAMPOS NORMALIZADOS
    license_type: licenseType,
    status: status,
    max_activations: license.max_devices || 1,
    current_activations: currentActivations,
    
    // ✅ FECHAS NORMALIZADAS
    issued_at: license.issued_date?.toISOString() || license.created_at.toISOString(),
    expires_at: license.expiry_date?.toISOString(),
    created_at: license.created_at.toISOString(),
    
    // ✅ RELACIONES
    client,
    branch,
  };
}

/**
 * 🔧 TRANSFORMAR DEVICE PARA EL DASHBOARD
 */
function transformDeviceForDashboard(binding: any): DashboardDevice {
  const device = binding.device;
  
  // 🔥 CONSTRUIR NOMBRE DEL DISPOSITIVO
  // Formato: "marca modelo" (ej: "samsung SM-X210")
  let deviceName = 'Dispositivo sin nombre';
  if (device) {
    const brand = device.build_brand || '';
    const model = device.build_model || '';
    
    if (brand && model) {
      deviceName = `${brand} ${model}`;
    } else if (model) {
      deviceName = model;
    } else if (brand) {
      deviceName = brand;
    }
  }
  
  // 🔥 CONSTRUIR VERSIÓN DEL OS
  // Formato: "Android 15" o solo "15"
  let osVersion = 'N/A';
  if (device?.android_version) {
    osVersion = `Android ${device.android_version}`;
  }
  
  // 🔥 CONSTRUIR VERSIÓN DE LA APP
  // Usar los primeros 8 caracteres del hash de firma
  let appVersion = 'N/A';
  if (device?.app_signature_hash) {
    appVersion = `v${device.app_signature_hash.substring(0, 8)}`;
  }
  
  return {
    id: binding.id,
    license_id: binding.license_id,
    device_fingerprint: device?.device_fingerprint || 'unknown',
    
    // ✅ CAMPOS MEJORADOS
    device_name: deviceName,
    device_model: device?.build_model || 'N/A',
    os_version: osVersion,
    app_version: appVersion,
    
    ip_address: binding.last_seen_ip || binding.activation_ip || 'N/A',
    is_active: binding.is_active,
    is_blacklisted: device?.is_blacklisted || false,
    last_heartbeat: binding.last_heartbeat_at?.toISOString(),
    activated_at: binding.activated_at?.toISOString(),
  };
}

/**
 * ═══════════════════════════════════════════════════════════════
 * 🔐 CONTROLADOR DE LICENCIAS
 * ═══════════════════════════════════════════════════════════════
 */
@Controller('licenses')
export class LicensesController {
  constructor(
    private readonly licensesService: LicensesService,
    private readonly activationService: ActivationService,
    private readonly devicesService: DevicesService,
    private readonly auditService: AuditService,
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // 🔓 ENDPOINTS PÚBLICOS PARA APK
  // ═══════════════════════════════════════════════════════════════

  @Public()
  @Post('activate')
  @HttpCode(HttpStatus.OK)
  async activateDevice(@Body() activateDto: ActivateDeviceDto, @Req() req: Request) {
    console.log('📱 [APK] Activando dispositivo...');
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    return await this.activationService.activateDevice(activateDto, ipAddress);
  }

  @Public()
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateLicense(@Body() validateDto: ValidateLicenseDto, @Req() req: Request) {
    console.log('🔍 [APK] Validando licencia...');
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    return await this.activationService.validateLicense(validateDto, ipAddress);
  }

  @Public()
  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  async heartbeat(@Body() heartbeatDto: HeartbeatDto, @Req() req: Request) {
    console.log('💓 [APK] Heartbeat recibido');
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    return await this.activationService.heartbeat(heartbeatDto, ipAddress);
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔓 ENDPOINTS PÚBLICOS PARA DASHBOARD
  // ═══════════════════════════════════════════════════════════════

  /**
   * GET /api/licenses
   * 🔓 PÚBLICO - Obtener todas las licencias transformadas
   */
  @Public()
  @Get()
  async findAllLicenses(
    @Query('status') status?: LicenseStatus,
    @Query('type') type?: LicenseType,
    @Query('client_id') clientId?: string,
    @Query('branch_id') branchId?: string,
  ) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 [Dashboard] GET /licenses');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 1️⃣ OBTENER LICENCIAS CON RELACIONES
    const licenses = await this.licensesService.findAll({
      status,
      type,
      clientId,
      branchId,
    });

    console.log(`✅ Licencias obtenidas: ${licenses.length}`);

    // 2️⃣ TRANSFORMAR CADA LICENCIA
    const transformed = licenses.map(license => {
      const result = transformLicenseForDashboard(license);
      
      // 🔍 LOG de primera licencia para debug
      if (license === licenses[0]) {
        console.log('📦 Primera licencia transformada:');
        console.log('   Original type:', license.type);
        console.log('   → license_type:', result.license_type);
        console.log('   Original status:', license.status);
        console.log('   → status:', result.status);
        console.log('   Bindings activos:', result.current_activations);
        console.log('   Cliente:', result.client?.company_name || 'Sin cliente');
      }
      
      return result;
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      success: true,
      count: transformed.length,
      data: transformed,
    };
  }

  /**
   * GET /api/licenses/devices/all
   * 🔓 PÚBLICO - Obtener todos los dispositivos
   */
  @Public()
  @Get('devices/all')
  async findAllDevices() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 [Dashboard] GET /devices/all');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Obtener todos los bindings con relaciones
    const licenses = await this.licensesService.findAll({});
    
    // Extraer todos los device_bindings
    const allBindings = licenses.flatMap(license => 
      license.device_bindings || []
    );

    console.log(`✅ Device bindings encontrados: ${allBindings.length}`);
    
    // 🔥 VERIFICAR QUE SE CARGARON LOS DEVICES
    const bindingsWithDevice = allBindings.filter(b => b.device);
    console.log(`📱 Bindings con device cargado: ${bindingsWithDevice.length}`);
    
    if (bindingsWithDevice.length < allBindings.length) {
      console.warn(`⚠️ ADVERTENCIA: ${allBindings.length - bindingsWithDevice.length} bindings SIN device cargado`);
      console.warn('   → Verifica que licenses.service.ts cargue .leftJoinAndSelect("binding.device", "device")');
    }

    // Transformar a formato del dashboard
    const devices = allBindings.map(binding => {
      const transformed = transformDeviceForDashboard(binding);
      
      // 🔍 LOG del primer dispositivo para debug
      if (binding === allBindings[0]) {
        console.log('📦 Primer dispositivo transformado:');
        console.log('   device_name:', transformed.device_name);
        console.log('   device_model:', transformed.device_model);
        console.log('   os_version:', transformed.os_version);
        console.log('   app_version:', transformed.app_version);
      }
      
      return transformed;
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      success: true,
      count: devices.length,
      data: devices,
    };
  }

  /**
   * POST /api/licenses/devices/:id/unblacklist
   * 🔓 PÚBLICO - Desbloquear un dispositivo
   */
  @Public()
  @Post('devices/:id/unblacklist')
  @HttpCode(HttpStatus.OK)
  async unblacklistDevice(@Param('id') id: string) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔓 [Dashboard] Desbloqueando device binding: ${id}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // 🔥 IMPORTANTE: 'id' es el ID del DeviceLicense (binding), NO del Device
    // Necesitamos obtener el device_fingerprint para desbloquear
    
    const licenses = await this.licensesService.findAll({});
    const binding = licenses
      .flatMap(l => l.device_bindings || [])
      .find(b => b.id === id);

    if (!binding) {
      throw new Error(`Device binding con ID ${id} no encontrado`);
    }

    if (!binding.device) {
      throw new Error('Device no cargado en el binding');
    }

    // Desbloquear el dispositivo
    await this.devicesService.unblacklist(binding.device.device_fingerprint);
    
    // Reactivar el binding si estaba desactivado
    if (!binding.is_active) {
      binding.reactivate();
    }

    console.log('✅ Dispositivo desbloqueado exitosamente');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    return {
      success: true,
      message: 'Dispositivo desbloqueado y reactivado exitosamente',
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔒 ENDPOINTS PROTEGIDOS (requieren JWT + SuperAdmin)
  // ═══════════════════════════════════════════════════════════════

  @Post()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async createLicense(
    @Body() createLicenseDto: CreateLicenseDto,
    @CurrentUser() admin: AdminUser,
  ) {
    const license = await this.licensesService.create(createLicenseDto, admin.email);
    return {
      success: true,
      message: 'Licencia creada exitosamente',
      data: transformLicenseForDashboard(license),
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async getStats() {
    const stats = await this.licensesService.getStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('search')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async searchLicenses(@Query('q') query: string) {
    const licenses = await this.licensesService.search(query);
    return {
      success: true,
      count: licenses.length,
      data: licenses.map(l => transformLicenseForDashboard(l)),
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async findOneLicense(@Param('id') id: string) {
    const license = await this.licensesService.findOne(id);
    return {
      success: true,
      data: transformLicenseForDashboard(license),
    };
  }

  @Post('revoke')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @HttpCode(HttpStatus.OK)
  async revokeLicense(
    @Body() revokeDto: RevokeLicenseDto,
    @CurrentUser() admin: AdminUser,
  ) {
    const license = await this.licensesService.revoke(
      revokeDto.license_id,
      revokeDto.reason,
      admin.email,
    );
    return {
      success: true,
      message: 'Licencia revocada exitosamente',
      data: transformLicenseForDashboard(license),
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 📱 ENDPOINTS DE DISPOSITIVOS PROTEGIDOS
  // ═══════════════════════════════════════════════════════════════

  @Get('devices/search')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async searchDevices(@Query('q') query: string) {
    const devices = await this.devicesService.search(query);
    return {
      success: true,
      count: devices.length,
      data: devices.map(d => d.toJSON()),
    };
  }

  @Get('devices/:id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async findOneDevice(@Param('id') id: string) {
    const device = await this.devicesService.findOne(id);
    return {
      success: true,
      data: device.toJSON(),
    };
  }

  @Post('devices/:id/blacklist')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @HttpCode(HttpStatus.OK)
  async blacklistDevice(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() admin: AdminUser,
  ) {
    const device = await this.devicesService.findOne(id);
    await this.devicesService.blacklist(
      device.device_fingerprint,
      reason,
      admin.email,
      true,
    );
    return {
      success: true,
      message: 'Dispositivo bloqueado exitosamente',
    };
  }

  @Get('devices/blacklisted/all')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async findBlacklistedDevices() {
    const devices = await this.devicesService.findBlacklisted();
    return {
      success: true,
      count: devices.length,
      data: devices.map(d => d.toJSON()),
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 📊 ENDPOINTS DE AUDITORÍA PROTEGIDOS
  // ═══════════════════════════════════════════════════════════════

  @Get('audit/recent')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async getRecentLogs(@Query('limit') limit?: number) {
    const logs = await this.auditService.getRecentLogs(limit ? +limit : 100);
    return {
      success: true,
      count: logs.length,
      data: logs.map(l => l.toJSON()),
    };
  }

  @Get('audit/critical')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async getCriticalEvents(@Query('limit') limit?: number) {
    const logs = await this.auditService.getCriticalEvents(limit ? +limit : 50);
    return {
      success: true,
      count: logs.length,
      data: logs.map(l => l.toJSON()),
    };
  }

  @Get('audit/cloning-attempts')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async getCloningAttempts(@Query('limit') limit?: number) {
    const logs = await this.auditService.getCloningAttempts(limit ? +limit : 50);
    return {
      success: true,
      count: logs.length,
      data: logs.map(l => l.toJSON()),
    };
  }

  @Get('audit/stats')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async getAuditStats() {
    const stats = await this.auditService.getEventStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('audit/device/:deviceId')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async getDeviceLogs(
    @Param('deviceId') deviceId: string,
    @Query('limit') limit?: number,
  ) {
    const logs = await this.auditService.getDeviceLogs(deviceId, limit ? +limit : 50);
    return {
      success: true,
      count: logs.length,
      data: logs.map(l => l.toJSON()),
    };
  }

  @Get('audit/license/:licenseId')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async getLicenseLogs(
    @Param('licenseId') licenseId: string,
    @Query('limit') limit?: number,
  ) {
    const logs = await this.auditService.getLicenseLogs(licenseId, limit ? +limit : 50);
    return {
      success: true,
      count: logs.length,
      data: logs.map(l => l.toJSON()),
    };
  }
}