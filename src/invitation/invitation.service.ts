import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvitationDto, UpdateInvitationDto } from './dto';

@Injectable()
export class InvitationService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────
  // Create invitation (Client only)
  // ──────────────────────────────────────────────

  async create(userId: string, dto: CreateInvitationDto) {
    // 1. Verify the client has an APPROVED order for this template
    const approvedOrder = await this.prisma.order.findFirst({
      where: {
        userId,
        templateId: dto.templateId,
        status: OrderStatus.APPROVED,
      },
    });

    if (!approvedOrder) {
      throw new BadRequestException(
        'You do not have an approved order for this template. ' +
          'Please purchase the template and wait for admin approval before creating an invitation.',
      );
    }

    // 2. Check slug uniqueness
    const existingSlug = await this.prisma.invitation.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new ConflictException(
        `The slug "${dto.slug}" is already taken. Please choose a different one.`,
      );
    }

    // 3. Create the invitation
    const invitation = await this.prisma.invitation.create({
      data: {
        userId,
        templateId: dto.templateId,
        slug: dto.slug,
        eventDate: new Date(dto.eventDate),
        locationUrl: dto.locationUrl,
        welcomeText: dto.welcomeText,
        images: dto.images,
        musicUrl: dto.musicUrl,
      },
      include: {
        template: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    return invitation;
  }

  // ──────────────────────────────────────────────
  // Update invitation (Client only — owner)
  // ──────────────────────────────────────────────

  async update(
    invitationId: string,
    userId: string,
    dto: UpdateInvitationDto,
  ) {
    // 1. Find the invitation
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException(
        `Invitation with ID "${invitationId}" not found`,
      );
    }

    // 2. Ensure the authenticated client owns this invitation
    if (invitation.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to edit this invitation',
      );
    }

    // 3. If slug is being updated, check uniqueness
    if (dto.slug && dto.slug !== invitation.slug) {
      const existingSlug = await this.prisma.invitation.findUnique({
        where: { slug: dto.slug },
      });

      if (existingSlug) {
        throw new ConflictException(
          `The slug "${dto.slug}" is already taken. Please choose a different one.`,
        );
      }
    }

    // 4. Build the update payload (only include provided fields)
    const updateData: Record<string, unknown> = {};

    if (dto.slug !== undefined) updateData.slug = dto.slug;
    if (dto.eventDate !== undefined)
      updateData.eventDate = new Date(dto.eventDate);
    if (dto.locationUrl !== undefined) updateData.locationUrl = dto.locationUrl;
    if (dto.welcomeText !== undefined) updateData.welcomeText = dto.welcomeText;
    if (dto.images !== undefined) updateData.images = dto.images;
    if (dto.musicUrl !== undefined) updateData.musicUrl = dto.musicUrl;

    // 5. Update
    const updatedInvitation = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: updateData,
      include: {
        template: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    return updatedInvitation;
  }

  // ──────────────────────────────────────────────
  // Get invitation by slug (Public)
  // ──────────────────────────────────────────────

  async findBySlug(slug: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { slug },
      include: {
        template: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            demoLink: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException(
        `Invitation with slug "${slug}" not found`,
      );
    }

    // Strip internal fields before returning to the public
    const { userId, ...publicData } = invitation;
    return publicData;
  }

  // ──────────────────────────────────────────────
  // Get RSVPs for an invitation (Client only — owner)
  // ──────────────────────────────────────────────

  async findRsvps(invitationId: string, userId: string) {
    // 1. Find the invitation
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException(
        `Invitation with ID "${invitationId}" not found`,
      );
    }

    // 2. Ensure the client owns this invitation
    if (invitation.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to view RSVPs for this invitation',
      );
    }

    // 3. Fetch all RSVPs
    const rsvps = await this.prisma.rSVP.findMany({
      where: { invitationId },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Compute statistics
    const totalResponses = rsvps.length;
    const attending = rsvps.filter((r) => r.willAttend);
    const excused = rsvps.filter((r) => !r.willAttend);

    const totalAttending = attending.reduce(
      (sum, r) => sum + 1 + r.companionsCount,
      0,
    );
    const totalExcused = excused.length;

    return {
      invitationId,
      statistics: {
        totalResponses,
        totalAttending,
        totalExcused,
        totalCompanions: attending.reduce(
          (sum, r) => sum + r.companionsCount,
          0,
        ),
      },
      rsvps,
    };
  }
}
