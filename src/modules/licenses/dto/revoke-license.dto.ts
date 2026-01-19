// src/modules/licenses/dto/revoke-license.dto.ts
import { 
  IsString, 
  IsNotEmpty, 
  IsUUID
} from 'class-validator';

/**
 * DTO para revocar una licencia
 * Solo el super admin puede hacer esto
 */
export class RevokeLicenseDto {
  @IsUUID('4', { message: 'License ID inválido' })
  @IsNotEmpty({ message: 'License ID es requerido' })
  license_id!: string;

  @IsString()
  @IsNotEmpty({ message: 'Razón de revocación es requerida' })
  reason!: string;
}

/**
 * Respuesta de revocación exitosa
 */
export interface RevokeLicenseResponseDto {
  success: true;
  message: string;
  license: {
    id: string;
    license_key: string;
    status: 'revoked';
    revoked_at: Date;
    revoked_reason: string;
    revoked_by: string;
  };
  devices_deactivated: number;
}