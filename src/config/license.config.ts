// src/config/license.config.ts
import { ConfigService } from '@nestjs/config';

/**
 * Tipos de licencia disponibles
 */
export enum LicenseType {
  TRIAL = 'trial',         // 10 días de prueba
  ANNUAL = 'annual',       // 365 días
  PERPETUAL = 'perpetual', // Sin expiración
}

/**
 * Estados de una licencia
 */
export enum LicenseStatus {
  ACTIVE = 'active',           // Activa y funcionando
  EXPIRED = 'expired',         // Expirada
  REVOKED = 'revoked',         // Revocada por admin
  GRACE_PERIOD = 'grace_period', // En período de gracia
  PENDING = 'pending',         // Creada pero no activada
}

/**
 * Configuración de licencias desde variables de entorno
 */
export class LicenseConfig {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Días de licencia trial
   */
  get trialDays(): number {
    return this.configService.get<number>('LICENSE_TRIAL_DAYS', 10);
  }

  /**
   * Días de licencia anual
   */
  get annualDays(): number {
    return this.configService.get<number>('LICENSE_ANNUAL_DAYS', 365);
  }

  /**
   * Intervalo de heartbeat en milisegundos
   */
  get heartbeatInterval(): number {
    return this.configService.get<number>('LICENSE_HEARTBEAT_INTERVAL', 300000); // 5 min
  }

  /**
   * Días de gracia tras expiración
   */
  get gracePeriodDays(): number {
    return this.configService.get<number>('LICENSE_GRACE_PERIOD_DAYS', 7);
  }

  /**
   * Máximo de intentos de activación fallidos
   */
  get maxActivationAttempts(): number {
    return this.configService.get<number>('MAX_ACTIVATION_ATTEMPTS', 3);
  }

  /**
   * Rondas de bcrypt
   */
  get bcryptRounds(): number {
    return this.configService.get<number>('BCRYPT_ROUNDS', 10);
  }

  /**
   * Tamaño de claves RSA
   */
  get rsaKeySize(): number {
    return this.configService.get<number>('RSA_KEY_SIZE', 2048);
  }

  /**
   * Máximo de intentos de login
   */
  get maxLoginAttempts(): number {
    return this.configService.get<number>('MAX_LOGIN_ATTEMPTS', 5);
  }

  /**
   * Minutos de bloqueo tras exceder intentos
   */
  get loginLockoutMinutes(): number {
    return this.configService.get<number>('LOGIN_LOCKOUT_MINUTES', 15);
  }

  /**
   * Calcula la fecha de expiración según el tipo de licencia
   */
  calculateExpiryDate(type: LicenseType): Date | null {
    const now = new Date();
    
    switch (type) {
      case LicenseType.TRIAL:
        return new Date(now.getTime() + this.trialDays * 24 * 60 * 60 * 1000);
      
      case LicenseType.ANNUAL:
        return new Date(now.getTime() + this.annualDays * 24 * 60 * 60 * 1000);
      
      case LicenseType.PERPETUAL:
        return null; // Sin expiración
      
      default:
        return null;
    }
  }

  /**
   * Verifica si una licencia está en período de gracia
   */
  isInGracePeriod(expiryDate: Date): boolean {
    if (!expiryDate) return false;
    
    const now = new Date();
    const gracePeriodEnd = new Date(
      expiryDate.getTime() + this.gracePeriodDays * 24 * 60 * 60 * 1000
    );
    
    return now > expiryDate && now <= gracePeriodEnd;
  }

  /**
   * Genera una license key aleatoria
   * Formato: LIC-XXXX-XXXX-XXXX-XXXX
   */
  generateLicenseKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = 4;
    const segmentLength = 4;
    
    const key = Array.from({ length: segments }, () => {
      return Array.from({ length: segmentLength }, () => {
        return chars.charAt(Math.floor(Math.random() * chars.length));
      }).join('');
    }).join('-');
    
    return `LIC-${key}`;
  }
}