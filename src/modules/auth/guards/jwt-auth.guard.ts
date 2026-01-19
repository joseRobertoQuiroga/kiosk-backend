// src/modules/auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard básico de JWT para endpoints específicos
 * NO verifica @Public() - eso lo hace GlobalAuthGuard
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    console.log('🔐 JwtAuthGuard: Validando token JWT...');
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      console.error('❌ JWT inválido:', info?.message || err?.message);
      throw err || new UnauthorizedException('Token JWT inválido o expirado');
    }

    console.log('✅ JWT válido - Usuario:', user.email);
    return user;
  }
}