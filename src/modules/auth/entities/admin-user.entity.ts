// src/modules/auth/entities/admin-user.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Entidad AdminUser - Super Administrador del Sistema
 * 
 * IMPORTANTE: Solo existe UN super admin que puede:
 * - Crear licencias
 * - Revocar licencias
 * - Transferir licencias entre dispositivos
 * - Ver todos los logs y estadísticas
 */
@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash!: string; // Hasheada con bcrypt

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 20, default: 'super_admin' })
  role!: string; // Solo 'super_admin' por ahora

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  // ═══════════════════════════════════════════════════════════
  // Control de intentos de login
  // ═══════════════════════════════════════════════════════════
  @Column({ type: 'int', default: 0 })
  failed_login_attempts!: number;

  @Column({ type: 'timestamp', nullable: true })
  locked_until!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at!: Date | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  last_login_ip!: string | null;

  // ═══════════════════════════════════════════════════════════
  // Tokens de refresh
  // ═══════════════════════════════════════════════════════════
  @Column({ type: 'text', nullable: true })
  refresh_token!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  refresh_token_expires_at!: Date | null;

  // ═══════════════════════════════════════════════════════════
  // Timestamps automáticos
  // ═══════════════════════════════════════════════════════════
  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  // ═══════════════════════════════════════════════════════════
  // Métodos helper
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Verifica si la cuenta está bloqueada
   */
  isLocked(): boolean {
    if (!this.locked_until) return false;
    return new Date() < this.locked_until;
  }

  /**
   * Incrementa intentos fallidos de login
   */
  incrementFailedAttempts(): void {
    this.failed_login_attempts += 1;
  }

  /**
   * Resetea intentos fallidos
   */
  resetFailedAttempts(): void {
    this.failed_login_attempts = 0;
    this.locked_until = null;
  }

  /**
   * Bloquea la cuenta por X minutos
   */
  lockAccount(minutes: number): void {
    this.locked_until = new Date(Date.now() + minutes * 60 * 1000);
  }

  /**
   * Actualiza último login
   */
  updateLastLogin(ip: string): void {
    this.last_login_at = new Date();
    this.last_login_ip = ip;
  }

  /**
   * Formato JSON para respuestas (sin password)
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      is_active: this.is_active,
      last_login_at: this.last_login_at,
      created_at: this.created_at,
    };
  }
}