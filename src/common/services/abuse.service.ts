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
    let ip = '';

    const cfConnectingIp = req.headers['cf-connecting-ip'];
    if (typeof cfConnectingIp === 'string') {
      ip = cfConnectingIp.trim();
    } else {
      const xRealIp = req.headers['x-real-ip'];
      if (typeof xRealIp === 'string') {
        ip = xRealIp.trim();
      } else {
        const xForwardedFor = req.headers['x-forwarded-for'];
        if (xForwardedFor) {
          const ips = typeof xForwardedFor === 'string'
            ? xForwardedFor.split(',')
            : xForwardedFor;
          if (ips.length > 0) {
            ip = ips[0].trim();
          }
        }
      }
    }

    if (!ip) {
      ip = req.ip || req.socket.remoteAddress || 'unknown';
    }

    // Normalize IPv6 mapped IPv4 addresses
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }

    return ip;
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

  async checkLoginBruteForce(email: string, ip: string): Promise<void> {
    const emailKey = `login:fail:${email}`;
    const ipKey = `login:fail:ip:${ip}`;

    const emailFailures = await this.getFailures(emailKey);
    if (emailFailures >= 5) {
      throw new TooManyRequestsException('Too many failed login attempts. Account locked. Please try again in 15 minutes.');
    }

    const ipFailures = await this.getFailures(ipKey);
    if (ipFailures >= 5) {
      throw new TooManyRequestsException('Too many failed login attempts from this IP. Please try again in 15 minutes.');
    }
  }

  async recordLoginFailure(email: string, ip: string): Promise<void> {
    const emailKey = `login:fail:${email}`;
    const ipKey = `login:fail:ip:${ip}`;
    const lockWindowMs = 15 * 60 * 1000; // 15 minutes

    await this.incrementFailures(emailKey, lockWindowMs);
    await this.incrementFailures(ipKey, lockWindowMs);
  }

  async resetLoginFailures(email: string, ip: string): Promise<void> {
    const emailKey = `login:fail:${email}`;
    const ipKey = `login:fail:ip:${ip}`;

    await this.cacheManager.del(emailKey);
    await this.cacheManager.del(ipKey);
  }

  private async getFailures(key: string): Promise<number> {
    const val = await this.cacheManager.get<number | string>(key);
    if (val === null || val === undefined) {
      return 0;
    }
    return typeof val === 'string' ? parseInt(val, 10) : Number(val);
  }

  private async incrementFailures(key: string, ttlMs: number): Promise<void> {
    const current = await this.getFailures(key);
    const nextVal = current + 1;

    await this.cacheManager.set(key, nextVal, ttlMs);
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
