// src/common/guards/global-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class GlobalAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // 🔍 Verificar si la ruta es pública ANTES de validar JWT
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // ✅ Si es pública, permitir acceso SIN validación JWT
    if (isPublic) {
      console.log('✅ Ruta pública detectada - Acceso permitido sin JWT');
      return true;
    }

    // 🔒 Si NO es pública, validar JWT con Passport
    console.log('🔒 Ruta protegida - Validando JWT...');
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // 🔍 Re-verificar si es pública (por si acaso)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return user; // Permitir incluso si no hay usuario
    }

    // 🚫 Si hay error o no hay usuario, lanzar excepción
    if (err || !user) {
      throw err || new UnauthorizedException('Token JWT inválido o expirado');
    }

    return user;
  }
}