// src/modules/licenses/entities/license-audit-log.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { License } from './license.entity';
import { Device } from './device.entity';

/**
 * Tipos de eventos de auditoría
 */
export enum AuditEventType {
  // Licencias
  LICENSE_CREATED = 'license_created',
  LICENSE_ACTIVATED = 'license_activated',
  LICENSE_RENEWED = 'license_renewed',
  LICENSE_REVOKED = 'license_revoked',
  LICENSE_EXPIRED = 'license_expired',
  LICENSE_TRANSFERRED = 'license_transferred',
  
  // Dispositivos
  DEVICE_REGISTERED = 'device_registered',
  DEVICE_BLACKLISTED = 'device_blacklisted',
  DEVICE_UNBLACKLISTED = 'device_unblacklisted',
  
  // Seguridad
  CLONING_ATTEMPT = 'cloning_attempt',
  ROOTED_DEVICE_DETECTED = 'rooted_device_detected',
  EMULATOR_DETECTED = 'emulator_detected',
  ACTIVATION_FAILED = 'activation_failed',
  INVALID_LICENSE_KEY = 'invalid_license_key',
  
  // Validación
  HEARTBEAT_RECEIVED = 'heartbeat_received',
  HEARTBEAT_MISSED = 'heartbeat_missed',
  VALIDATION_FAILED = 'validation_failed',
  
  // Administración
  ADMIN_LOGIN = 'admin_login',
  ADMIN_LOGOUT = 'admin_logout',
  ADMIN_ACTION = 'admin_action',
}

/**
 * Niveles de severidad
 */
export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Entidad LicenseAuditLog - Registro de Auditoría
 * 
 * Registra TODOS los eventos del sistema de licencias
 * Crucial para detectar intentos de clonación y anomalías
 */
@Entity('license_audit_logs')
export class LicenseAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ═══════════════════════════════════════════════════════════
  // Tipo de evento
  // ═══════════════════════════════════════════════════════════
  
  @Column({
    type: 'enum',
    enum: AuditEventType,
  })
  @Index()
  event_type!: AuditEventType;

  @Column({
    type: 'enum',
    enum: AuditSeverity,
    default: AuditSeverity.INFO,
  })
  @Index()
  severity!: AuditSeverity;

  @Column({ type: 'text' })
  message!: string; // Descripción del evento

  // ═══════════════════════════════════════════════════════════
  // Relaciones opcionales (pueden ser null)
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'uuid', nullable: true })
  @Index()
  license_id!: string | null;

  @ManyToOne(() => License, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'license_id' })
  license!: License | null;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  device_id!: string | null;

  @ManyToOne(() => Device, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'device_id' })
  device!: Device | null;

  // ═══════════════════════════════════════════════════════════
  // Datos adicionales del evento (JSON)
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'jsonb', nullable: true })
  event_data!: Record<string, any> | null;

  // Ejemplo de event_data:
  // {
  //   "license_key": "LIC-XXXX-XXXX-XXXX",
  //   "device_fingerprint": "abc123...",
  //   "attempt_count": 3,
  //   "reason": "Device already bound to another license"
  // }

  // ═══════════════════════════════════════════════════════════
  // Información de origen
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address!: string | null;

  @Column({ type: 'text', nullable: true })
  user_agent!: string | null; // Si es desde el APK o Dashboard

  @Column({ type: 'varchar', length: 100, nullable: true })
  admin_email!: string | null; // Si fue acción de admin

  // ═══════════════════════════════════════════════════════════
  // Timestamp
  // ═══════════════════════════════════════════════════════════
  
  @CreateDateColumn({ type: 'timestamp' })
  @Index()
  created_at!: Date;

  // ═══════════════════════════════════════════════════════════
  // Métodos helper
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Verifica si es un evento de seguridad crítico
   */
  isCritical(): boolean {
    return this.severity === AuditSeverity.CRITICAL;
  }

  /**
   * Verifica si es un intento de ataque
   */
  isSecurityThreat(): boolean {
    return [
      AuditEventType.CLONING_ATTEMPT,
      AuditEventType.ROOTED_DEVICE_DETECTED,
      AuditEventType.EMULATOR_DETECTED,
    ].includes(this.event_type);
  }

  toJSON() {
    return {
      id: this.id,
      event_type: this.event_type,
      severity: this.severity,
      message: this.message,
      license_id: this.license_id,
      device_id: this.device_id,
      event_data: this.event_data,
      ip_address: this.ip_address,
      admin_email: this.admin_email,
      is_critical: this.isCritical(),
      is_security_threat: this.isSecurityThreat(),
      created_at: this.created_at,
    };
  }
}