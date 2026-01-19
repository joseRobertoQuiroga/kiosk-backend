// src/modules/queries/dto/create-query.dto.ts - ✅ MEJORADO

import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateQueryDto {
  @IsString()
  @IsNotEmpty()
  codigo_barra!: string;

  @IsString()
  @IsNotEmpty()
  id_kiosco!: string;

  @IsOptional()
  @IsString()
  // ✅ VALIDAR: Solo permitir valores específicos
  @IsIn(['encontrado', 'no_encontrado', 'Ok', 'error', 'exito', 'success'], {
    message: 'El resultado debe ser: encontrado, no_encontrado, Ok, error, exito o success'
  })
  resultado?: string;
}