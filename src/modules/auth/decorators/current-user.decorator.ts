// src/modules/auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AdminUser } from '../entities/admin-user.entity';

/**
 * Decorador @CurrentUser()
 * Obtiene el usuario autenticado del request
 * 
 * Uso:
 * @Get('profile')
 * getProfile(@CurrentUser() user: AdminUser) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AdminUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);