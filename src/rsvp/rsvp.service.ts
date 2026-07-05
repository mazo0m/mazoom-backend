import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRsvpDto } from './dto';

@Injectable()
export class RsvpService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) { }

  // ──────────────────────────────────────────────
  // Submit RSVP (Public — any guest)
  // ──────────────────────────────────────────────

  async create(dto: CreateRsvpDto) {
    // 1. Verify the invitation exists
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: dto.invitationId },
    });

    if (!invitation) {
      throw new NotFoundException(
        `errors.invitation_not_found|${dto.invitationId}`,
      );
    }

    // 2. Create the RSVP entry
    const rsvp = await this.prisma.rSVP.create({
      data: {
        invitationId: dto.invitationId,
        name: dto.name,
        attendance: dto.attendance,
        guestsCount: dto.guestsCount,
        message: dto.message,
      },
    });

    // Invalidate the invitation slug cache so guestbook updates instantly
    await this.cacheManager.del(`invitations:slug:${invitation.slug}`);

    return rsvp;
  }
}

