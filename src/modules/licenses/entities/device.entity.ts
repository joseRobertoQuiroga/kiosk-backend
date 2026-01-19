// src/modules/licenses/entities/device.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { DeviceLicense } from './device-license.entity';

/**
 * Entidad Device - Dispositivos Físicos Únicos
 * 
 * Cada dispositivo Android tiene un fingerprint único
 * generado a partir de: ANDROID_ID + BUILD_BOARD + BUILD_BRAND + MAC_HASH
 */
@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ═══════════════════════════════════════════════════════════
  // Fingerprint único del dispositivo (SHA256)
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'varchar', length: 128, unique: true })
  @Index()
  device_fingerprint!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  device_name!: string | null; // Nombre asignado por el usuario

  // ═══════════════════════════════════════════════════════════
  // Información de hardware del dispositivo Android
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'varchar', length: 64, nullable: true })
  android_id!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  build_board!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  build_brand!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  build_model!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  build_manufacturer!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  android_version!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  mac_address_hash!: string | null; // Hash SHA256 de la MAC

  @Column({ type: 'varchar', length: 64, nullable: true })
  app_signature_hash!: string | null; // Hash de la firma del APK

  // ═══════════════════════════════════════════════════════════
  // Detección de seguridad
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'boolean', default: false })
  @Index()
  is_rooted!: boolean; // Detectado root/jailbreak

  @Column({ type: 'boolean', default: false })
  @Index()
  is_emulator!: boolean; // Detectado emulador

  @Column({ type: 'boolean', default: false })
  @Index()
  is_blacklisted!: boolean; // Bloqueado manualmente

  @Column({ type: 'text', nullable: true })
  blacklist_reason!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  blacklisted_at!: Date | null;

  // ═══════════════════════════════════════════════════════════
  // Estadísticas de uso
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'timestamp' })
  first_seen_at!: Date; // Primera vez que se conectó

  @Column({ type: 'timestamp', nullable: true })
  last_seen_at!: Date | null; // Último heartbeat

  @Column({ type: 'int', default: 0 })
  total_activations!: number; // Cuántas veces intentó activar

  @Column({ type: 'int', default: 0 })
  failed_activations!: number; // Intentos fallidos

  @Column({ type: 'varchar', length: 45, nullable: true })
  last_ip_address!: string | null;

  // ═══════════════════════════════════════════════════════════
  // Relaciones
  // ═══════════════════════════════════════════════════════════
  
  @OneToMany(() => DeviceLicense, (deviceLicense) => deviceLicense.device)
  license_bindings!: DeviceLicense[];

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
   * Verifica si el dispositivo puede activar licencias
   */
  canActivate(): boolean {
    return !this.is_blacklisted && !this.is_rooted;
  }

  /**
   * Marca como bloqueado
   */
  blacklist(reason: string): void {
    this.is_blacklisted = true;
    this.blacklist_reason = reason;
    this.blacklisted_at = new Date();
  }

  /**
   * Remueve del blacklist
   */
  unblacklist(): void {
    this.is_blacklisted = false;
    this.blacklist_reason = null;
    this.blacklisted_at = null;
  }

  /**
   * Actualiza último acceso
   */
  updateLastSeen(ipAddress?: string): void {
    this.last_seen_at = new Date();
    if (ipAddress) {
      this.last_ip_address = ipAddress;
    }
  }

  /**
   * Incrementa contador de activaciones
   */
  incrementActivations(success: boolean): void {
    this.total_activations += 1;
    if (!success) {
      this.failed_activations += 1;
    }
  }

  toJSON() {
    return {
      id: this.id,
      device_fingerprint: this.device_fingerprint,
      device_name: this.device_name,
      build_brand: this.build_brand,
      build_model: this.build_model,
      android_version: this.android_version,
      is_rooted: this.is_rooted,
      is_emulator: this.is_emulator,
      is_blacklisted: this.is_blacklisted,
      first_seen_at: this.first_seen_at,
      last_seen_at: this.last_seen_at,
      total_activations: this.total_activations,
      can_activate: this.canActivate(),
      created_at: this.created_at,
    };
  }
}