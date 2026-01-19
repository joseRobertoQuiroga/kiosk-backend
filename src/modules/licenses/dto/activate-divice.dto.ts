// src/modules/licenses/dto/activate-device.dto.ts
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsBoolean,
  Length,
  Matches
} from 'class-validator';

/**
 * DTO para activar un dispositivo con una licencia
 * Esto es lo que el APK Flutter enviará
 */
export class ActivateDeviceDto {
  @IsString()
  @IsNotEmpty({ message: 'License key es requerido' })
  @Length(20, 64, { message: 'License key inválido' })
  license_key!: string;

  @IsString()
  @IsNotEmpty({ message: 'Device fingerprint es requerido' })
  @Length(64, 128, { message: 'Device fingerprint inválido' })
  @Matches(/^[a-f0-9]+$/i, { message: 'Device fingerprint debe ser hexadecimal' })
  device_fingerprint!: string;

  // Información del dispositivo Android
  @IsString()
  @IsOptional()
  device_name?: string;

  @IsString()
  @IsOptional()
  android_id?: string;

  @IsString()
  @IsOptional()
  build_board?: string;

  @IsString()
  @IsOptional()
  build_brand?: string;

  @IsString()
  @IsOptional()
  build_model?: string;

  @IsString()
  @IsOptional()
  build_manufacturer?: string;

  @IsString()
  @IsOptional()
  android_version?: string;

  @IsString()
  @IsOptional()
  mac_address_hash?: string;

  @IsString()
  @IsOptional()
  app_signature_hash?: string;

  // Detección de seguridad
  @IsBoolean()
  @IsOptional()
  is_rooted?: boolean;

  @IsBoolean()
  @IsOptional()
  is_emulator?: boolean;

  // Kiosco ID (opcional, de tu tabla existente)
  @IsString()
  @IsOptional()
  kiosco_id?: string;
}

/**
 * Respuesta exitosa de activación
 */
export interface ActivateDeviceResponseDto {
  success: true;
  message: string;
  activation_code: string;
  jwt_token: string;
  expires_at: Date;
  device: {
    id: string;
    device_fingerprint: string;
    device_name: string | null;
  };
  license: {
    id: string;
    license_key: string;
    type: string;
    expiry_date: Date | null;
  };
  client: {
    id: string;
    name: string;
  };
  branch: {
    id: string;
    name: string;
  };
}

/**
 * Respuesta de error de activación
 */
export interface ActivateDeviceErrorDto {
  success: false;
  error: string;
  error_code: string;
  details?: any;
}