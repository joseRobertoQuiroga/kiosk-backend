// src/modules/licenses/dto/create-license.dto.ts
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max
} from 'class-validator';
import { LicenseType } from '../entities/license.entity';

/**
 * DTO para crear una nueva licencia
 * Solo el super admin puede crear licencias
 */
export class CreateLicenseDto {
  @IsEnum(LicenseType, { message: 'Tipo de licencia inválido' })
  @IsNotEmpty({ message: 'Tipo de licencia es requerido' })
  type!: LicenseType;

  @IsUUID('4', { message: 'ID de cliente inválido' })
  @IsNotEmpty({ message: 'ID del cliente es requerido' })
  client_id!: string;

  @IsUUID('4', { message: 'ID de sucursal inválido' })
  @IsNotEmpty({ message: 'ID de la sucursal es requerido' })
  branch_id!: string;

  @IsInt()
  @Min(1)
  @Max(1) // Siempre 1 según requerimientos
  @IsOptional()
  max_devices?: number;

  @IsString()
  @IsOptional()
  notes?: string; // Notas internas del admin
}

/**
 * Respuesta al crear una licencia
 */
export interface CreateLicenseResponseDto {
  id: string;
  license_key: string;
  type: LicenseType;
  status: string;
  issued_date: Date;
  expiry_date: Date | null;
  client: {
    id: string;
    name: string;
  };
  branch: {
    id: string;
    name: string;
  };
  created_by: string;
  message: string;
}