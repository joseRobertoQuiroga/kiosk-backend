// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AdminUser } from './entities/admin-user.entity';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { JwtPayload } from '../../config/jwt.config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Login del super admin
   */
  async login(loginDto: LoginDto, ipAddress: string): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    // Buscar usuario por email
    const user = await this.adminUserRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si está bloqueado
    if (user.isLocked()) {
      throw new UnauthorizedException(
        `Cuenta bloqueada hasta ${user.locked_until?.toLocaleString()}. ` +
        `Demasiados intentos fallidos.`,
      );
    }

    // Verificar contraseña
    const isPasswordValid = await CryptoUtil.comparePassword(
      password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      // Incrementar intentos fallidos
      user.incrementFailedAttempts();

      // Bloquear si excede el máximo
      const maxAttempts = this.configService.get<number>('MAX_LOGIN_ATTEMPTS', 5);
      if (user.failed_login_attempts >= maxAttempts) {
        const lockoutMinutes = this.configService.get<number>('LOGIN_LOCKOUT_MINUTES', 15);
        user.lockAccount(lockoutMinutes);
        await this.adminUserRepository.save(user);

        throw new UnauthorizedException(
          `Cuenta bloqueada por ${lockoutMinutes} minutos debido a múltiples intentos fallidos`,
        );
      }

      await this.adminUserRepository.save(user);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Login exitoso: resetear intentos fallidos
    user.resetFailedAttempts();
    user.updateLastLogin(ipAddress);

    // Generar tokens
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'super_admin',
    };

const accessToken = this.jwtService.sign(payload);
   const refreshToken = this.jwtService.sign(payload, {
  secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
  expiresIn: '730d',
});


    // Guardar refresh token
    user.refresh_token = refreshToken;
    user.refresh_token_expires_at = new Date(
      Date.now() + 730 * 24 * 60 * 60 * 1000, // 730 días
    );

    await this.adminUserRepository.save(user);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 365 * 24 * 60 * 60, // 1 año en segundos
      token_type: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Logout (invalidar refresh token)
   */
  async logout(userId: string): Promise<void> {
    await this.adminUserRepository.update(userId, {
      refresh_token: null,
      refresh_token_expires_at: null,
    });
  }

  /**
   * Refrescar token de acceso
   */
  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.adminUserRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || user.refresh_token !== refreshToken) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      if (!user.is_active) {
        throw new UnauthorizedException('Usuario inactivo');
      }

      // Generar nuevo access token
      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'super_admin',
      };

      const accessToken = this.jwtService.sign(newPayload);

      return { access_token: accessToken };
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  async getProfile(userId: string): Promise<AdminUser> {
    const user = await this.adminUserRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.adminUserRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isPasswordValid = await CryptoUtil.comparePassword(
      oldPassword,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Contraseña actual incorrecta');
    }

    // Hashear nueva contraseña
    const bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS', 10);
    user.password_hash = await CryptoUtil.hashPassword(newPassword, bcryptRounds);

    await this.adminUserRepository.save(user);
  }

  /**
   * Crear super admin (solo para inicialización)
   * Este método se usa en el seed inicial
   */
  async createSuperAdmin(
    email: string,
    password: string,
    name: string,
  ): Promise<AdminUser> {
    // Verificar si ya existe
    const existingUser = await this.adminUserRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Super admin ya existe');
    }

    // Hashear contraseña
    const bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS', 10);
    const passwordHash = await CryptoUtil.hashPassword(password, bcryptRounds);

    // Crear usuario
    const superAdmin = this.adminUserRepository.create({
      email,
      password_hash: passwordHash,
      name,
      role: 'super_admin',
      is_active: true,
    });

    return await this.adminUserRepository.save(superAdmin);
  }
}