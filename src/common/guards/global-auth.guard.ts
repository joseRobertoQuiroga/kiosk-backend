// src/common/guards/global-auth.guard.ts
// ✅ VERSIÓN CORREGIDA - RESPETA DECORADOR @Public()

import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class GlobalAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // ═══════════════════════════════════════════════════════════════
    // 1️⃣ VERIFICAR SI EL ENDPOINT TIENE @Public()
    // ═══════════════════════════════════════════════════════════════
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),  // Método del controller (ej: create())
      context.getClass(),    // Clase del controller (ej: QueriesController)
    ]);

    // ═══════════════════════════════════════════════════════════════
    // 2️⃣ SI ES PÚBLICO, PERMITIR ACCESO INMEDIATAMENTE
    // ═══════════════════════════════════════════════════════════════
    if (isPublic) {
      const request = context.switchToHttp().getRequest();
      console.log(`✅ Endpoint público: ${request.method} ${request.url}`);
      return true;
    }

    // ═══════════════════════════════════════════════════════════════
    // 3️⃣ SI NO ES PÚBLICO, VERIFICAR JWT
    // ═══════════════════════════════════════════════════════════════
    const request = context.switchToHttp().getRequest();
    console.log(`🔒 Endpoint protegido: ${request.method} ${request.url} - Verificando JWT`);
    
    return super.canActivate(context);
  }

  // ═══════════════════════════════════════════════════════════════
  // MANEJAR ERRORES DE AUTENTICACIÓN
  // ═══════════════════════════════════════════════════════════════
  handleRequest(err, user, info) {
    // Si hay error o no hay usuario
    if (err || !user) {
      throw err || new UnauthorizedException({
        statusCode: 401,
        message: 'Token JWT inválido o ausente',
        error: 'Unauthorized'
      });
    }
    
    return user;
  }
}