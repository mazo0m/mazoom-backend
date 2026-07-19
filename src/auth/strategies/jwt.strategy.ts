import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.accessToken;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Called by Passport after it successfully verifies the JWT signature.
   * The returned object is attached to `request.user`.
   * User lookup is cached to prevent querying DB on every API call.
   */
  async validate(payload: JwtPayload) {
    const cacheKey = `users:id:${payload.sub}`;

    // Check cache first
    let cachedUser = await this.cacheManager.get<{
      id: string;
      email: string;
      role: string;
      isActive: boolean;
    }>(cacheKey);

    if (!cachedUser) {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('errors.user_deleted');
      }

      cachedUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      };

      // Cache user lookup for 5 minutes (300,000 ms)
      await this.cacheManager.set(cacheKey, cachedUser, 300000);
    }

    if (!cachedUser.isActive) {
      throw new UnauthorizedException('errors.user_deactivated');
    }

    return {
      id: cachedUser.id,
      email: cachedUser.email,
      role: cachedUser.role,
    };
  }
}
