import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateKioscoDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  ubicacion!: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}