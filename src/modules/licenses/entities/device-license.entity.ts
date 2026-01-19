// src/modules/licenses/entities/device-license.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { License } from './license.entity';
import { Device } from './device.entity';
import { Kiosco } from '../../kioscos/entities/kiosco.entity';

/**
 * Entidad DeviceLicense - Binding 1-a-1 entre Licencia y Dispositivo
 * 
 * REGLAS CRÍTICAS:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 1. UNA licencia → UN SOLO dispositivo activo
 * 2. UN dispositivo → UNA SOLA licencia activa (pero puede tener historial)
 * 3. El kiosco_id es OPCIONAL pero si existe debe ser válido
 * 4. Un dispositivo puede cambiar de kiosco sin reactivar
 * 5. El fingerprint del dispositivo es INMUTABLE una vez casado
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
@Entity('device_licenses')
@Unique(['license_id']) // ✅ UNA LICENCIA = UN SOLO BINDING (siempre)
// ❌ ELIMINADO: @Unique(['device_id']) 
// ✅ REEMPLAZADO POR: Índice único compuesto que permite historial
@Index(['device_id', 'is_active'], { 
  unique: true, 
  where: '"is_active" = true' 
})
export class DeviceLicense {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ═══════════════════════════════════════════════════════════
  // 🔗 RELACIÓN LICENCIA (1-a-1 ESTRICTO)
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'uuid' })
  @Index()
  license_id!: string;

  @ManyToOne(() => License, (license) => license.device_bindings, { 
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'license_id' })
  license!: License;

  // ═══════════════════════════════════════════════════════════
  // 📱 RELACIÓN DISPOSITIVO (Permite historial)
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'uuid' })
  @Index()
  device_id!: string;

  @ManyToOne(() => Device, (device) => device.license_bindings, { 
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'device_id' })
  device!: Device;

  // ═══════════════════════════════════════════════════════════
  // 🏪 RELACIÓN KIOSCO (OPCIONAL - Para visualización)
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'uuid', nullable: true })
  @Index()
  kiosco_id!: string | null;

  @ManyToOne(() => Kiosco, { 
    onDelete: 'SET NULL', 
    nullable: true,
    eager: false,
  })
  @JoinColumn({ name: 'kiosco_id' })
  kiosco!: Kiosco | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  kiosco_name!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  kiosco_location!: string | null;

  // ═══════════════════════════════════════════════════════════
  // ⚡ ESTADO DE ACTIVACIÓN
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'boolean', default: true })
  @Index()
  is_active!: boolean;

  @Column({ type: 'timestamp' })
  activated_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  deactivated_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  deactivation_reason!: string | null;

  // ═══════════════════════════════════════════════════════════
  // 🔐 CÓDIGO DE ACTIVACIÓN Y JWT
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'varchar', length: 128, unique: true })
  @Index()
  activation_code!: string;

  @Column({ type: 'text', nullable: true })
  jwt_token!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  jwt_expires_at!: Date | null;

  // ═══════════════════════════════════════════════════════════
  // 💓 HEARTBEAT (Ping cada 5 minutos)
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'timestamp', nullable: true })
  @Index()
  last_heartbeat_at!: Date | null;

  @Column({ type: 'int', default: 0 })
  heartbeat_count!: number;

  @Column({ type: 'int', default: 0 })
  missed_heartbeats!: number;

  // ═══════════════════════════════════════════════════════════
  // 🌐 INFORMACIÓN DE RED
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'varchar', length: 45, nullable: true })
  activation_ip!: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  last_seen_ip!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  // ═══════════════════════════════════════════════════════════
  // 📅 TIMESTAMPS
  // ═══════════════════════════════════════════════════════════
  
  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  // ═══════════════════════════════════════════════════════════
  // 🛠️ MÉTODOS HELPER
  // ═══════════════════════════════════════════════════════════
  
  isValid(): boolean {
    return this.is_active && this.deactivated_at === null;
  }

  updateHeartbeat(ipAddress?: string): void {
    this.last_heartbeat_at = new Date();
    this.heartbeat_count += 1;
    this.missed_heartbeats = 0;
    
    if (ipAddress) {
      this.last_seen_ip = ipAddress;
    }
  }

  incrementMissedHeartbeats(): void {
    this.missed_heartbeats += 1;
  }

  deactivate(reason: string): void {
    this.is_active = false;
    this.deactivated_at = new Date();
    this.deactivation_reason = reason;
  }

  reactivate(): void {
    this.is_active = true;
    this.deactivated_at = null;
    this.deactivation_reason = null;
    this.missed_heartbeats = 0;
  }

  shouldAlert(maxMissedHeartbeats: number = 5): boolean {
    return this.is_active && this.missed_heartbeats >= maxMissedHeartbeats;
  }

  updateKiosco(kiosco: Kiosco | null): void {
    if (kiosco) {
      this.kiosco_id = kiosco.id;
      this.kiosco_name = kiosco.nombre;
      this.kiosco_location = kiosco.ubicacion;
    } else {
      this.kiosco_id = null;
      this.kiosco_name = null;
      this.kiosco_location = null;
    }
  }

  getMinutesSinceLastHeartbeat(): number | null {
    if (!this.last_heartbeat_at) return null;
    
    const now = new Date();
    const diff = now.getTime() - this.last_heartbeat_at.getTime();
    return Math.floor(diff / (1000 * 60));
  }

  isHeartbeatLate(thresholdMinutes: number = 10): boolean {
    const minutes = this.getMinutesSinceLastHeartbeat();
    if (minutes === null) return true;
    return minutes > thresholdMinutes;
  }

  toJSON() {
    return {
      id: this.id,
      license_id: this.license_id,
      device_id: this.device_id,
      kiosco_id: this.kiosco_id,
      kiosco_name: this.kiosco_name,
      kiosco_location: this.kiosco_location,
      is_active: this.is_active,
      activated_at: this.activated_at,
      deactivated_at: this.deactivated_at,
      deactivation_reason: this.deactivation_reason,
      last_heartbeat_at: this.last_heartbeat_at,
      heartbeat_count: this.heartbeat_count,
      missed_heartbeats: this.missed_heartbeats,
      minutes_since_last_heartbeat: this.getMinutesSinceLastHeartbeat(),
      is_valid: this.isValid(),
      is_heartbeat_late: this.isHeartbeatLate(),
      should_alert: this.shouldAlert(),
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}