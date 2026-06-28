import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRsvpDto } from './dto';

@Injectable()
export class RsvpService {
  constructor(private readonly prisma: PrismaService) {}

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
        `Invitation with ID "${dto.invitationId}" not found`,
      );
    }

    // 2. Create the RSVP entry
    const rsvp = await this.prisma.rSVP.create({
      data: {
        invitationId: dto.invitationId,
        guestName: dto.guestName,
        willAttend: dto.willAttend,
        companionsCount: dto.companionsCount,
      },
    });

    return rsvp;
  }
}
