// src/modules/clients/dto/create-branch.dto.ts
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsBoolean,
  IsUUID,
  MaxLength 
} from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty({ message: 'Nombre de la sucursal es requerido' })
  @MaxLength(150)
  name!: string;

  @IsOptional() // ⬅️ CLAVE
  @IsUUID()
  client_id?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string; // Código interno

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  contact_phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  manager_name?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateBranchDto {
  @IsString()
  @IsOptional()
  @MaxLength(150)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  contact_phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  manager_name?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}