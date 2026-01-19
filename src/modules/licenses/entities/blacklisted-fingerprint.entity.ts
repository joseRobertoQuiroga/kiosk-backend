// src/modules/licenses/entities/blacklisted-fingerprint.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Entidad BlacklistedFingerprint - Lista Negra de Dispositivos
 * 
 * Dispositivos bloqueados permanentemente por:
 * - Intentos de clonación
 * - Múltiples intentos fallidos de activación
 * - Dispositivos rooteados/emuladores
 * - Bloqueo manual del administrador
 */
@Entity('blacklisted_fingerprints')
export class BlacklistedFingerprint {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ═══════════════════════════════════════════════════════════
  // Fingerprint bloqueado
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'varchar', length: 128, unique: true })
  @Index()
  device_fingerprint!: string;

  @Column({ type: 'text' })
  reason!: string; // Razón del bloqueo

  @Column({ type: 'varchar', length: 100 })
  blocked_by!: string; // Email del admin o "system" si fue automático

  // ═══════════════════════════════════════════════════════════
  // Información del dispositivo bloqueado
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'varchar', length: 100, nullable: true })
  device_info!: string | null; // Marca/modelo si está disponible

  @Column({ type: 'varchar', length: 45, nullable: true })
  last_seen_ip!: string | null;

  @Column({ type: 'int', default: 0 })
  violation_count!: number; // Número de violaciones detectadas

  // ═══════════════════════════════════════════════════════════
  // Tipo de bloqueo
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'boolean', default: false })
  is_permanent!: boolean; // false = puede ser desbloqueado

  @Column({ type: 'timestamp', nullable: true })
  unblock_after!: Date | null; // Fecha de desbloqueo automático

  // ═══════════════════════════════════════════════════════════
  // Timestamps
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'timestamp' })
  blocked_at!: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  // ═══════════════════════════════════════════════════════════
  // Métodos helper
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Verifica si el bloqueo sigue activo
   */
  isActive(): boolean {
    if (this.is_permanent) return true;
    if (!this.unblock_after) return true;
    return new Date() < this.unblock_after;
  }

  /**
   * Incrementa contador de violaciones
   */
  incrementViolations(): void {
    this.violation_count += 1;
  }

  /**
   * Marca como permanente
   */
  makePermanent(): void {
    this.is_permanent = true;
    this.unblock_after = null;
  }

  toJSON() {
    return {
      id: this.id,
      device_fingerprint: this.device_fingerprint,
      reason: this.reason,
      blocked_by: this.blocked_by,
      device_info: this.device_info,
      violation_count: this.violation_count,
      is_permanent: this.is_permanent,
      is_active: this.isActive(),
      blocked_at: this.blocked_at,
      created_at: this.created_at,
    };
  }
}