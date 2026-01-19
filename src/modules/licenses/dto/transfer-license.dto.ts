// src/modules/licenses/dto/transfer-license.dto.ts
import { 
  IsString, 
  IsNotEmpty, 
  IsUUID,
  Length,
  Matches
} from 'class-validator';

/**
 * DTO para transferir una licencia de un dispositivo a otro
 * Solo el super admin puede hacer esto
 */
export class TransferLicenseDto {
  @IsUUID('4', { message: 'License ID inválido' })
  @IsNotEmpty({ message: 'License ID es requerido' })
  license_id!: string;

  @IsString()
  @IsNotEmpty({ message: 'Device fingerprint antiguo es requerido' })
  @Length(64, 128)
  @Matches(/^[a-f0-9]+$/i)
  old_device_fingerprint!: string;

  @IsString()
  @IsNotEmpty({ message: 'Device fingerprint nuevo es requerido' })
  @Length(64, 128)
  @Matches(/^[a-f0-9]+$/i)
  new_device_fingerprint!: string;

  @IsString()
  @IsNotEmpty({ message: 'Razón de transferencia es requerida' })
  reason!: string;
}

/**
 * Respuesta de transferencia exitosa
 */
export interface TransferLicenseResponseDto {
  success: true;
  message: string;
  old_device: {
    id: string;
    device_fingerprint: string;
    deactivated_at: Date;
  };
  new_device: {
    id: string;
    device_fingerprint: string;
    new_activation_code: string;
  };
  license: {
    id: string;
    license_key: string;
  };
}