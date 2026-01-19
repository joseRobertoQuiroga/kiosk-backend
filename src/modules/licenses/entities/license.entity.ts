// src/modules/licenses/entities/license.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Branch } from '../../clients/entities/branch.entity';
import { DeviceLicense } from './device-license.entity';

/**
 * Tipos de licencia
 */
export enum LicenseType {
  TRIAL = 'trial',         // 10 días
  ANNUAL = 'annual',       // 365 días
  PERPETUAL = 'perpetual', // Sin expiración
}

/**
 * Estados de licencia
 */
export enum LicenseStatus {
  PENDING = 'pending',         // Creada pero no activada
  ACTIVE = 'active',           // Activa y funcionando
  EXPIRED = 'expired',         // Expirada
  REVOKED = 'revoked',         // Revocada por admin
  GRACE_PERIOD = 'grace_period', // En período de gracia
}

/**
 * Entidad License - Licencias Maestras del Sistema
 * 
 * Cada licencia pertenece a una sucursal específica
 * Una licencia se puede activar en UN SOLO dispositivo
 */
@Entity('licenses')
export class License {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ═══════════════════════════════════════════════════════════
  // Información de la licencia
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'varchar', length: 64, unique: true })
  @Index()
  license_key!: string; // LIC-XXXX-XXXX-XXXX-XXXX

  @Column({
    type: 'enum',
    enum: LicenseType,
    default: LicenseType.ANNUAL,
  })
  @Index()
  type!: LicenseType;

  @Column({
    type: 'enum',
    enum: LicenseStatus,
    default: LicenseStatus.PENDING,
  })
  @Index()
  status!: LicenseStatus;

  @Column({ type: 'int', default: 1 })
  max_devices!: number; // Siempre 1 según requerimientos

  // ═══════════════════════════════════════════════════════════
  // Fechas
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'timestamp' })
  issued_date!: Date; // Fecha de emisión

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  expiry_date!: Date | null; // null = perpetua

  @Column({ type: 'timestamp', nullable: true })
  first_activated_at!: Date | null; // Primera activación

  @Column({ type: 'timestamp', nullable: true })
  last_validated_at!: Date | null; // Último heartbeat

  // ═══════════════════════════════════════════════════════════
  // Revocación
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'timestamp', nullable: true })
  revoked_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  revoked_reason!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  revoked_by!: string | null; // Email del admin

  // ═══════════════════════════════════════════════════════════
  // Información del creador
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'varchar', length: 100 })
  created_by!: string; // Email del admin que la creó

  @Column({ type: 'text', nullable: true })
  notes!: string | null; // Notas internas

  // ═══════════════════════════════════════════════════════════
  // Relaciones con Cliente y Sucursal
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'uuid' })
  @Index()
  client_id!: string;

  @ManyToOne(() => Client, (client) => client.licenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client!: Client;

  @Column({ type: 'uuid' })
  @Index()
  branch_id!: string;

  @ManyToOne(() => Branch, (branch) => branch.licenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  // ═══════════════════════════════════════════════════════════
  // Relación con dispositivos
  // ═══════════════════════════════════════════════════════════
  
  @OneToMany(() => DeviceLicense, (deviceLicense) => deviceLicense.license)
  device_bindings!: DeviceLicense[];

  // ═══════════════════════════════════════════════════════════
  // Timestamps
  // ═══════════════════════════════════════════════════════════
  
  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  // ═══════════════════════════════════════════════════════════
  // Métodos helper
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Verifica si la licencia está expirada
   */
  isExpired(): boolean {
    if (!this.expiry_date) return false; // Perpetua
    return new Date() > this.expiry_date;
  }

  /**
   * Verifica si está en período de gracia
   */
  isInGracePeriod(graceDays: number = 7): boolean {
    if (!this.expiry_date) return false;
    
    const now = new Date();
    const graceEnd = new Date(this.expiry_date.getTime() + graceDays * 24 * 60 * 60 * 1000);
    
    return now > this.expiry_date && now <= graceEnd;
  }

  /**
   * Verifica si está activa y válida
   */
  isValid(): boolean {
    return (
      this.status === LicenseStatus.ACTIVE &&
      !this.isExpired() &&
      this.revoked_at === null
    );
  }

  /**
   * Marca como revocada
   */
  revoke(reason: string, adminEmail: string): void {
    this.status = LicenseStatus.REVOKED;
    this.revoked_at = new Date();
    this.revoked_reason = reason;
    this.revoked_by = adminEmail;
  }

  toJSON() {
    return {
      id: this.id,
      license_key: this.license_key,
      type: this.type,
      status: this.status,
      max_devices: this.max_devices,
      issued_date: this.issued_date,
      expiry_date: this.expiry_date,
      first_activated_at: this.first_activated_at,
      last_validated_at: this.last_validated_at,
      created_by: this.created_by,
      client_id: this.client_id,
      branch_id: this.branch_id,
      created_at: this.created_at,
      updated_at: this.updated_at,
      is_expired: this.isExpired(),
      is_valid: this.isValid(),
    };
  }
}