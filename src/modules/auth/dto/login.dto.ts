// src/modules/auth/dto/login.dto.ts
import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email es requerido' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password es requerido' })
  @MinLength(8, { message: 'Password debe tener al menos 8 caracteres' })
  password!: string;
}

/**
 * Respuesta del login exitoso
 */
export interface LoginResponseDto {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}