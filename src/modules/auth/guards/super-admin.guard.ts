// src/modules/auth/guards/super-admin.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminUser } from '../entities/admin-user.entity';

/**
 * Guard de Super Admin
 * Verifica que el usuario autenticado sea super_admin
 * 
 * Uso:
 * @UseGuards(JwtAuthGuard, SuperAdminGuard)
 * async createLicense() { ... }
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AdminUser = request.user;

    if (!user) {
      throw new ForbiddenException('No autenticado');
    }

    if (user.role !== 'super_admin') {
      throw new ForbiddenException(
        'Acceso denegado: Se requiere rol de Super Administrador',
      );
    }

    return true;
  }
}