import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import * as express from 'express';
import { AbuseService } from '../services/abuse.service';

@Injectable()
export class AbuseGuard implements CanActivate {
  constructor(private readonly abuseService: AbuseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<express.Request>();

    // Use request fingerprinting for global rate limit
    const fingerprint = this.abuseService.getFingerprint(req);
    await this.abuseService.checkGlobalRateLimit(fingerprint);

    return true;
  }
}
