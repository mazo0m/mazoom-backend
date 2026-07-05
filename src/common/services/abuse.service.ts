import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as express from 'express';
import { createHash } from 'crypto';
import { TooManyRequestsException } from '../exceptions/too-many-requests.exception';

@Injectable()
export class AbuseService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  extractIp(req: express.Request): string {
    return (
      req.ip ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  getFingerprint(req: express.Request): string {
    const ip = this.extractIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const raw = [
      ip,
      userAgent,
      acceptLanguage,
      req.headers['sec-ch-ua'] || '',
      req.headers['sec-fetch-site'] || '',
    ].join('|');

    return createHash('sha256')
      .update(raw)
      .digest('hex');
  }

  async checkGlobalRateLimit(ip: string): Promise<void> {
    await this.checkRateLimit(`rate-limit:global:${ip}`, 100, 60 * 1000, 'Too many requests. Please try again later.');
  }

  async checkRsvpLimit(ip: string, invitationId: string): Promise<void> {
    await this.checkRateLimit(`rate-limit:rsvp:${ip}:${invitationId}`, 3, 3600 * 1000, 'errors.rsvp_limit_reached|Too many RSVPs submitted. Please try again in an hour.');
  }

  async checkUploadLimit(ip: string, invitationId: string): Promise<void> {
    await this.checkRateLimit(`rate-limit:upload:${ip}:${invitationId}`, 5, 60 * 1000, 'errors.upload_limit_reached|Too many uploads. Please try again in a minute.');
  }

  private async checkRateLimit(key: string, limit: number, windowMs: number, errorMessage: string): Promise<void> {
    const keyv = (this.cacheManager as any).stores?.[0];
    const client = keyv?.opts?.store?.client;
    const now = Date.now();

    if (client && typeof client.multi === 'function') {
      const clearBefore = now - windowMs;
      const member = `${now}:${Math.random()}`;
      
      const results = await client
        .multi()
        .zAdd(key, { score: now, value: member })
        .zRemRangeByScore(key, 0, clearBefore)
        .zCard(key)
        .pExpire(key, windowMs)
        .exec();

      const count = results[2] as number;
      if (count > limit) {
        throw new TooManyRequestsException(errorMessage);
      }
    } else {
      let timestamps = await this.cacheManager.get<number[]>(key) || [];
      if (!Array.isArray(timestamps)) {
        timestamps = [];
      }
      timestamps = timestamps.filter((ts) => now - ts < windowMs);
      if (timestamps.length >= limit) {
        throw new TooManyRequestsException(errorMessage);
      }
      timestamps.push(now);
      await this.cacheManager.set(key, timestamps, windowMs);
    }
  }
}
