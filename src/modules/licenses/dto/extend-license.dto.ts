// src/modules/licenses/dto/extend-license.dto.ts
import { IsUUID, IsInt, Min, Max } from 'class-validator';

export class ExtendLicenseDto {
  @IsUUID('4', { message: 'ID de licencia inválido' })
  license_id!: string;

  @IsInt({ message: 'Días debe ser un número entero' })
  @Min(1, { message: 'Mínimo 1 día' })
  @Max(3650, { message: 'Máximo 10 años (3650 días)' })
  days!: number;
}