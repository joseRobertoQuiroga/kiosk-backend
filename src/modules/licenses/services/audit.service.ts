// src/modules/licenses/services/audit.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LicenseAuditLog,
  AuditEventType,
  AuditSeverity,
} from '../entities/license-audit-log.entity';

/**
 * Servicio de Auditoría
 * Registra TODOS los eventos del sistema de licencias
 */
@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(LicenseAuditLog)
    private readonly auditLogRepository: Repository<LicenseAuditLog>,
  ) {}

  /**
   * Registrar un evento de auditoría
   */
  async logEvent(params: {
    eventType: AuditEventType;
    severity: AuditSeverity;
    message: string;
    licenseId?: string;
    deviceId?: string;
    eventData?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    adminEmail?: string;
  }): Promise<LicenseAuditLog> {
    const log = this.auditLogRepository.create({
      event_type: params.eventType,
      severity: params.severity,
      message: params.message,
      license_id: params.licenseId || null,
      device_id: params.deviceId || null,
      event_data: params.eventData || null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
      admin_email: params.adminEmail || null,
    });

    const savedLog = await this.auditLogRepository.save(log);

    // Log crítico en consola
    if (params.severity === AuditSeverity.CRITICAL) {
      console.error('🚨 EVENTO CRÍTICO:', params.message);
    } else if (params.severity === AuditSeverity.ERROR) {
      console.error('❌ ERROR:', params.message);
    } else if (params.severity === AuditSeverity.WARNING) {
      console.warn('⚠️  WARNING:', params.message);
    }

    return savedLog;
  }

  /**
   * Registrar creación de licencia
   */
  async logLicenseCreated(
    licenseId: string,
    adminEmail: string,
    licenseKey: string,
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.LICENSE_CREATED,
      severity: AuditSeverity.INFO,
      message: `Licencia ${licenseKey} creada`,
      licenseId,
      adminEmail,
      eventData: { license_key: licenseKey },
    });
  }

  /**
   * Registrar activación exitosa
   */
  async logLicenseActivated(
    licenseId: string,
    deviceId: string,
    ipAddress: string,
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.LICENSE_ACTIVATED,
      severity: AuditSeverity.INFO,
      message: `Licencia activada en dispositivo`,
      licenseId,
      deviceId,
      ipAddress,
    });
  }

  /**
   * Registrar revocación de licencia
   */
  async logLicenseRevoked(
    licenseId: string,
    adminEmail: string,
    reason: string,
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.LICENSE_REVOKED,
      severity: AuditSeverity.WARNING,
      message: `Licencia revocada: ${reason}`,
      licenseId,
      adminEmail,
      eventData: { reason },
    });
  }

  /**
   * Registrar intento de clonación (CRÍTICO)
   */
  async logCloningAttempt(
    licenseId: string,
    deviceId: string,
    ipAddress: string,
    details: any,
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.CLONING_ATTEMPT,
      severity: AuditSeverity.CRITICAL,
      message: '🚨 INTENTO DE CLONACIÓN DETECTADO',
      licenseId,
      deviceId,
      ipAddress,
      eventData: details,
    });
  }

  /**
   * Registrar dispositivo rooteado detectado
   */
  async logRootedDevice(
    deviceId: string,
    deviceFingerprint: string,
    ipAddress: string,
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.ROOTED_DEVICE_DETECTED,
      severity: AuditSeverity.CRITICAL,
      message: 'Dispositivo rooteado detectado',
      deviceId,
      ipAddress,
      eventData: { device_fingerprint: deviceFingerprint },
    });
  }

  /**
   * Registrar emulador detectado
   */
  async logEmulatorDetected(
    deviceId: string,
    deviceFingerprint: string,
    ipAddress: string,
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.EMULATOR_DETECTED,
      severity: AuditSeverity.CRITICAL,
      message: 'Emulador detectado',
      deviceId,
      ipAddress,
      eventData: { device_fingerprint: deviceFingerprint },
    });
  }

  /**
   * Registrar heartbeat recibido
   */
  async logHeartbeat(
    licenseId: string,
    deviceId: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.HEARTBEAT_RECEIVED,
      severity: AuditSeverity.INFO,
      message: 'Heartbeat recibido',
      licenseId,
      deviceId,
      ipAddress,
    });
  }

  /**
   * Registrar dispositivo bloqueado
   */
  async logDeviceBlacklisted(
    deviceId: string,
    reason: string,
    adminEmail: string,
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.DEVICE_BLACKLISTED,
      severity: AuditSeverity.WARNING,
      message: `Dispositivo bloqueado: ${reason}`,
      deviceId,
      adminEmail,
      eventData: { reason },
    });
  }

  /**
   * Registrar intento de activación fallido
   */
  async logActivationFailed(
    licenseKey: string,
    deviceFingerprint: string,
    reason: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.ACTIVATION_FAILED,
      severity: AuditSeverity.WARNING,
      message: `Activación fallida: ${reason}`,
      ipAddress,
      eventData: {
        license_key: licenseKey,
        device_fingerprint: deviceFingerprint,
        reason,
      },
    });
  }

  /**
   * Obtener logs recientes
   */
  async getRecentLogs(limit: number = 100): Promise<LicenseAuditLog[]> {
    return await this.auditLogRepository.find({
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Obtener logs de un dispositivo específico
   */
  async getDeviceLogs(deviceId: string, limit: number = 50): Promise<LicenseAuditLog[]> {
    return await this.auditLogRepository.find({
      where: { device_id: deviceId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Obtener logs de una licencia específica
   */
  async getLicenseLogs(licenseId: string, limit: number = 50): Promise<LicenseAuditLog[]> {
    return await this.auditLogRepository.find({
      where: { license_id: licenseId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Obtener eventos críticos (alertas)
   */
  async getCriticalEvents(limit: number = 50): Promise<LicenseAuditLog[]> {
    return await this.auditLogRepository.find({
      where: { severity: AuditSeverity.CRITICAL },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Obtener intentos de clonación
   */
  async getCloningAttempts(limit: number = 50): Promise<LicenseAuditLog[]> {
    return await this.auditLogRepository.find({
      where: { event_type: AuditEventType.CLONING_ATTEMPT },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Contar eventos de un tipo específico
   */
  async countEventsByType(eventType: AuditEventType): Promise<number> {
    return await this.auditLogRepository.count({
      where: { event_type: eventType },
    });
  }

  /**
   * Obtener estadísticas de eventos
   */
  async getEventStats(): Promise<any> {
    const total = await this.auditLogRepository.count();
    const critical = await this.auditLogRepository.count({
      where: { severity: AuditSeverity.CRITICAL },
    });
    const errors = await this.auditLogRepository.count({
      where: { severity: AuditSeverity.ERROR },
    });
    const warnings = await this.auditLogRepository.count({
      where: { severity: AuditSeverity.WARNING },
    });
    const cloningAttempts = await this.countEventsByType(
      AuditEventType.CLONING_ATTEMPT,
    );

    return {
      total,
      by_severity: {
        critical,
        errors,
        warnings,
        info: total - critical - errors - warnings,
      },
      security_threats: {
        cloning_attempts: cloningAttempts,
        rooted_devices: await this.countEventsByType(
          AuditEventType.ROOTED_DEVICE_DETECTED,
        ),
        emulators: await this.countEventsByType(
          AuditEventType.EMULATOR_DETECTED,
        ),
      },
    };
  }
}