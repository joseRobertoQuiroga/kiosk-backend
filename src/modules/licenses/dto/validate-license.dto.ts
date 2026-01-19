// src/modules/licenses/dto/validate-license.dto.ts
import { 
  IsString, 
  IsNotEmpty,
  Length,
  Matches
} from 'class-validator';

/**
 * DTO para validar una licencia (usado en arranque de app)
 */
export class ValidateLicenseDto {
  @IsString()
  @IsNotEmpty({ message: 'Device fingerprint es requerido' })
  @Length(64, 128)
  @Matches(/^[a-f0-9]+$/i)
  device_fingerprint!: string;

  @IsString()
  @IsNotEmpty({ message: 'Activation code es requerido' })
  activation_code!: string;
}

/**
 * Respuesta de validación exitosa
 */
export interface ValidateLicenseResponseDto {
  valid: true;
  message: string;
  license: {
    id: string;
    license_key: string;
    type: string;
    status: string;
    expiry_date: Date | null;
    days_remaining: number | null;
    is_in_grace_period: boolean;
  };
  device: {
    id: string;
    device_fingerprint: string;
    device_name: string | null;
  };
  client: {
    id: string;
    name: string;
  };
  branch: {
    id: string;
    name: string;
  };
  kiosco?: {                     // ✅ OPCIONAL
    id: string;
    nombre: string;
    ubicacion: string | null;
    activo: boolean;
  } | null;

}

/**
 * Respuesta de validación fallida
 */
export interface ValidateLicenseErrorDto {
  valid: false;
  error: string;
  error_code: string;
  action_required: 'renew' | 'contact_admin' | 'reactivate';
}