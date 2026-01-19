// src/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AdminUser } from './entities/admin-user.entity';

@Controller('auth') // ✅ Ruta base: /api/auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ═══════════════════════════════════════════════════════════════
  // 🔓 ENDPOINTS PÚBLICOS (sin JWT)
  // ═══════════════════════════════════════════════════════════════

  /**
   * POST /api/auth/login
   * Login del super admin
   * 
   * ⚠️ IMPORTANTE: @Public() debe estar ANTES de @Post()
   * ⚠️ NO usar @UseGuards() en rutas públicas
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    console.log('📥 Login request recibido:', { email: loginDto.email });
    
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const result = await this.authService.login(loginDto, ipAddress);
    
    console.log('✅ Login exitoso:', result.user.email);
    return result;
  }

  /**
   * POST /api/auth/refresh
   * Refrescar access token usando refresh token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    console.log('🔄 Refresh token request recibido');
    return await this.authService.refreshToken(refreshToken);
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔒 ENDPOINTS PROTEGIDOS (requieren JWT)
  // ═══════════════════════════════════════════════════════════════

  /**
   * GET /api/auth/profile
   * Obtener perfil del usuario autenticado
   * 
   * ⚠️ AQUÍ SÍ usamos @UseGuards() porque es una ruta protegida
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: AdminUser) {
    console.log('👤 Perfil solicitado:', user.email);
    return user.toJSON();
  }

  /**
   * POST /api/auth/logout
   * Cerrar sesión (invalidar refresh token)
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: AdminUser) {
    console.log('👋 Logout:', user.email);
    await this.authService.logout(user.id);
    return {
      message: 'Sesión cerrada exitosamente',
    };
  }

  /**
   * POST /api/auth/change-password
   * Cambiar contraseña del usuario autenticado
   */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: AdminUser,
    @Body('old_password') oldPassword: string,
    @Body('new_password') newPassword: string,
  ) {
    console.log('🔑 Cambio de contraseña solicitado:', user.email);
    await this.authService.changePassword(user.id, oldPassword, newPassword);
    return {
      message: 'Contraseña actualizada exitosamente',
    };
  }

  /**
   * GET /api/auth/validate
   * Validar si el token JWT es válido
   */
  @Get('validate')
  @UseGuards(JwtAuthGuard)
  async validateToken(@CurrentUser() user: AdminUser) {
    console.log('✅ Token validado:', user.email);
    return {
      valid: true,
      user: user.toJSON(),
    };
  }
}