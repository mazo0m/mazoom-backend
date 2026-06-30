import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RsvpAttendance } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvitationDto, UpdateInvitationDto } from './dto';

@Injectable()
export class InvitationService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────
  // Create invitation (Client only)
  // ──────────────────────────────────────────────

  async create(userId: string, dto: CreateInvitationDto) {
    // 1. Verify the client has access to this purchase
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: dto.purchaseId },
      include: {
        invitation: true,
      },
    });

    if (!purchase) {
      throw new NotFoundException(
        `Purchase with ID "${dto.purchaseId}" not found`,
      );
    }

    if (purchase.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to create an invitation for this purchase',
      );
    }

    // 2. Ensure an invitation does not already exist for this purchase (1:1 relation)
    if (purchase.invitation) {
      throw new BadRequestException(
        'An invitation has already been generated for this purchase. Please update the existing invitation.',
      );
    }

    // 3. Check slug uniqueness
    const existingSlug = await this.prisma.invitation.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new ConflictException(
        `The slug "${dto.slug}" is already taken. Please choose a different one.`,
      );
    }

    // 4. Create the invitation
    const invitation = await this.prisma.invitation.create({
      data: {
        purchaseId: dto.purchaseId,
        slug: dto.slug,
        eventTitle: dto.eventTitle,
        eventLocation: dto.eventLocation,
        eventDate: new Date(dto.eventDate),
        locationUrl: dto.locationUrl,
        welcomeText: dto.welcomeText,
        images: dto.images ?? [],
        musicUrl: dto.musicUrl,
      },
      include: {
        purchase: {
          include: {
            template: {
              select: {
                id: true,
                title: true,
                previewImage: true,
              },
            },
          },
        },
      },
    });

    // Adapt response structure to keep frontend/admin representations clean
    return this.mapInvitationResponse(invitation);
  }

  // ──────────────────────────────────────────────
  // Update invitation (Client only — owner)
  // ──────────────────────────────────────────────

  async update(invitationId: string, userId: string, dto: UpdateInvitationDto) {
    // 1. Find the invitation
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        purchase: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException(
        `Invitation with ID "${invitationId}" not found`,
      );
    }

    // 2. Ensure the authenticated client owns this invitation
    if (invitation.purchase.userId !== userId) {
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

      // Also update slug in purchase record if appropriate
      await this.prisma.purchase.update({
        where: { id: invitation.purchaseId },
        data: { slug: dto.slug },
      });
    }

    // 4. Build the update payload (only include provided fields)
    const updateData: Record<string, any> = {};

    if (dto.slug !== undefined) updateData.slug = dto.slug;
    if (dto.eventTitle !== undefined) updateData.eventTitle = dto.eventTitle;
    if (dto.eventLocation !== undefined)
      updateData.eventLocation = dto.eventLocation;
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
        purchase: {
          include: {
            template: {
              select: {
                id: true,
                title: true,
                previewImage: true,
              },
            },
          },
        },
      },
    });

    return this.mapInvitationResponse(updatedInvitation);
  }

  // ──────────────────────────────────────────────
  // Get invitation by slug (Public)
  // ──────────────────────────────────────────────

  async findBySlug(slug: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { slug },
      include: {
        purchase: {
          include: {
            template: {
              select: {
                id: true,
                title: true,
                previewImage: true,
                demoLink: true,
              },
            },
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException(`Invitation with slug "${slug}" not found`);
    }

    return this.mapInvitationResponse(invitation);
  }

  // ──────────────────────────────────────────────
  // Get RSVPs for an invitation (Client only — owner)
  // ──────────────────────────────────────────────

  async findRsvps(invitationId: string, userId: string) {
    // 1. Find the invitation
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        purchase: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException(
        `Invitation with ID "${invitationId}" not found`,
      );
    }

    // 2. Ensure the client owns this invitation
    if (invitation.purchase.userId !== userId) {
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
    const attending = rsvps.filter((r) => r.attendance === RsvpAttendance.YES);
    const excused = rsvps.filter((r) => r.attendance === RsvpAttendance.NO);

    const totalAttending = attending.reduce(
      (sum, r) => sum + 1 + r.guestsCount,
      0,
    );
    const totalExcused = excused.length;

    return {
      invitationId,
      statistics: {
        totalResponses,
        totalAttending,
        totalExcused,
        totalCompanions: attending.reduce((sum, r) => sum + r.guestsCount, 0),
      },
      rsvps,
    };
  }

  // ──────────────────────────────────────────────
  // Helper: map database output to API response
  // ──────────────────────────────────────────────

  private mapInvitationResponse(invitation: any) {
    const { purchase, ...invitationFields } = invitation;
    return {
      ...invitationFields,
      userId: purchase?.userId,
      templateId: purchase?.templateId,
      template: purchase?.template,
    };
  }
}
