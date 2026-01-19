import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateVideoDto {
  @IsString()
  @IsOptional()
  titulo?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsNumber()
  @IsOptional()
  orden?: number;
}