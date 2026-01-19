// src/config/jwt.config.ts
import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';

/**
 * Configuración de JWT para autenticación
 */
export const getJwtConfig = (
  configService: ConfigService,
): JwtModuleOptions => ({
  secret: configService.getOrThrow<string>('JWT_SECRET'),
  signOptions: {
    expiresIn: configService.getOrThrow<JwtSignOptions['expiresIn']>(
      'JWT_EXPIRES_IN',
    ),
    issuer: 'kiosko-license-system',
    audience: 'kiosko-api',
  },
});

/**
 * Configuración de Refresh Token
 */
export const getRefreshTokenConfig = (
  configService: ConfigService,
): JwtModuleOptions => ({
  secret: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
  signOptions: {
    expiresIn: configService.getOrThrow<JwtSignOptions['expiresIn']>(
      'JWT_REFRESH_EXPIRES_IN',
    ),
    issuer: 'kiosko-license-system',
    audience: 'kiosko-api',
  },
});

/**
 * Interface para el payload del JWT
 */
export interface JwtPayload {
  sub: string;           // User ID
  email: string;
  name: string;
  role: 'super_admin';   // Solo super admin puede crear licencias
  iat?: number;          // Issued at
  exp?: number;          // Expiration
}

/**
 * Interface para el payload de licencias en dispositivos
 */
export interface LicenseJwtPayload {
  sub: string;              // Device ID
  license_id: string;
  device_fingerprint: string;
  client_id: string;
  branch_id: string;
  license_type: 'trial' | 'annual' | 'perpetual';
  issued_at: Date;
  expires_at: Date | null;
  iat?: number;
  exp?: number;
}