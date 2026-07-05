import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId?: string;
    action: string;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      // fire-and-forget safe write
      void this.prisma.auditLog.create({
        data: {
          userId: params.userId ?? null,
          action: params.action,
          ip: params.ip ?? null,
          userAgent: params.userAgent ?? null,
          metadata: params.metadata as any,
        },
      });
    } catch (error) {
      this.logger.error(
        `AuditLog failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  async logLoginSuccess(userId: string, email: string, ip: string, userAgent: string) {
    await this.log({
      userId,
      action: 'LOGIN_SUCCESS',
      ip,
      userAgent,
      metadata: { email },
    });
  }

  async logLoginFailure(email: string, reason: string, ip: string, userAgent: string) {
    await this.log({
      action: 'LOGIN_FAILURE',
      ip,
      userAgent,
      metadata: { email, reason },
    });
  }

  async logLogout(userId: string, ip: string, userAgent: string) {
    await this.log({
      userId,
      action: 'LOGOUT',
      ip,
      userAgent,
    });
  }

  async logRefreshTokenReuse(
    userId: string,
    tokenHash: string,
    ip: string,
    userAgent: string,
  ) {
    await this.log({
      userId,
      action: 'REFRESH_TOKEN_REUSE',
      ip,
      userAgent,
      metadata: { tokenHash },
    });
  }

  async logPasswordChange(userId: string, ip: string, userAgent: string) {
    await this.log({
      userId,
      action: 'PASSWORD_CHANGE',
      ip,
      userAgent,
    });
  }
}