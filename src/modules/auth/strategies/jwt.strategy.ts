// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '../entities/admin-user.entity';
import { JwtPayload } from '../../../config/jwt.config';

/**
 * Estrategia JWT para Passport
 * Valida el token JWT en cada request protegido
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Valida el payload del JWT y retorna el usuario
   * Se ejecuta automáticamente en cada request con JWT válido
   */
  async validate(payload: JwtPayload): Promise<AdminUser> {
    const { sub: userId } = payload;

    // Buscar el usuario en la base de datos
    const user = await this.adminUserRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    if (user.isLocked()) {
      throw new UnauthorizedException(
        `Cuenta bloqueada hasta ${user.locked_until?.toLocaleString()}`,
      );
    }

    // El usuario se adjunta automáticamente a request.user
    return user;
  }
}