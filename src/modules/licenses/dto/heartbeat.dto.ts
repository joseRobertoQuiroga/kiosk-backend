// src/modules/licenses/dto/heartbeat.dto.ts
import { 
  IsString, 
  IsNotEmpty,
  Length,
  Matches
} from 'class-validator';

/**
 * DTO para heartbeat (ping cada 5 minutos desde el APK)
 * Esto mantiene la licencia activa y validada
 */
export class HeartbeatDto {
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
 * Respuesta de heartbeat exitoso
 */
export interface HeartbeatResponseDto {
  success: true;
  message: string;
  next_heartbeat_in: number; // Milisegundos hasta el próximo heartbeat
  license_status: {
    is_valid: boolean;
    is_expired: boolean;
    is_in_grace_period: boolean;
    days_remaining: number | null;
  };
  warnings?: string[]; // Advertencias como "Licencia expira en 7 días"
}

/**
 * Respuesta de heartbeat fallido
 */
export interface HeartbeatErrorDto {
  success: false;
  error: string;
  error_code: string;
  action_required: 'stop_operation' | 'contact_admin' | 'renew_license';
}