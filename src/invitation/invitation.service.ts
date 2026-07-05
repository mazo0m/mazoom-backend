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

/** Fields from the DTO that map directly to Prisma update data. */
const UPDATABLE_STRING_FIELDS = [
  'slug', 'languageMode', 'eventTitle', 'eventTitleAr', 'eventTitleEn',
  'eventLocation', 'eventLocationAr', 'eventLocationEn',
  'locationUrl', 'welcomeText', 'welcomeTextAr', 'welcomeTextEn',
  'musicUrl', 'contactName', 'contactPhone',
] as const;

const UPDATABLE_ARRAY_FIELDS = ['images', 'eventProgram', 'eventDetails', 'moments'] as const;
const UPDATABLE_BOOLEAN_FIELDS = ['isActive', 'allowGuestUploads'] as const;

@Injectable()
export class InvitationService {
  constructor(private readonly prisma: PrismaService) {}

  /** Standard include clause for invitation responses with template info. */
  private readonly invitationInclude = {
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
  } as const;

  // ──────────────────────────────────────────────
  // Create invitation (Client only)
  // ──────────────────────────────────────────────

  async create(userId: string, dto: CreateInvitationDto) {
    // 1. Verify the client has access to this purchase
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: dto.purchaseId },
      include: { invitation: true },
    });

    if (!purchase) {
      throw new NotFoundException(
        `errors.purchase_not_found|${dto.purchaseId}`,
      );
    }

    if (purchase.userId !== userId) {
      throw new ForbiddenException('errors.unauthorized_invitation');
    }

    if (purchase.invitation) {
      throw new BadRequestException('errors.invitation_exists');
    }

    // 2. Check slug uniqueness
    await this.ensureSlugAvailable(dto.slug);

    // 3. Create the invitation
    const invitation = await this.prisma.invitation.create({
      data: {
        purchaseId: dto.purchaseId,
        slug: dto.slug,
        languageMode: dto.languageMode ?? purchase.languageMode,
        eventTitle: dto.eventTitle,
        eventTitleAr: dto.eventTitleAr,
        eventTitleEn: dto.eventTitleEn,
        eventLocation: dto.eventLocation,
        eventLocationAr: dto.eventLocationAr,
        eventLocationEn: dto.eventLocationEn,
        eventDate: new Date(dto.eventDate),
        locationUrl: dto.locationUrl,
        welcomeText: dto.welcomeText,
        welcomeTextAr: dto.welcomeTextAr,
        welcomeTextEn: dto.welcomeTextEn,
        images: dto.images ?? [],
        musicUrl: dto.musicUrl,
        eventProgram: dto.eventProgram ?? [],
        eventDetails: dto.eventDetails ?? [],
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        allowGuestUploads: dto.allowGuestUploads ?? true,
        moments: dto.moments ?? [],
      },
      include: this.invitationInclude,
    });

    return this.mapInvitationResponse(invitation);
  }

  // ──────────────────────────────────────────────
  // Update invitation (Client owner or Admin)
  // ──────────────────────────────────────────────

  async update(
    invitationId: string,
    userId: string,
    userRole: string,
    dto: UpdateInvitationDto,
  ) {
    // 1. Find the invitation
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { purchase: true },
    });

    if (!invitation) {
      throw new NotFoundException(
        `errors.invitation_not_found|${invitationId}`,
      );
    }

    // 2. Ensure the authenticated client owns this invitation OR is an ADMIN
    if (invitation.purchase.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('errors.unauthorized_edit');
    }

    // 3. If slug is being updated, check uniqueness
    if (dto.slug && dto.slug !== invitation.slug) {
      await this.ensureSlugAvailable(dto.slug);

      // Also update slug in purchase record
      await this.prisma.purchase.update({
        where: { id: invitation.purchaseId },
        data: { slug: dto.slug },
      });
    }

    // 4. Build update payload dynamically from DTO (replaces 20+ manual if-checks)
    const updateData: Record<string, any> = {};

    for (const field of UPDATABLE_STRING_FIELDS) {
      if (dto[field] !== undefined) updateData[field] = dto[field];
    }
    for (const field of UPDATABLE_ARRAY_FIELDS) {
      if (dto[field] !== undefined) updateData[field] = dto[field];
    }
    for (const field of UPDATABLE_BOOLEAN_FIELDS) {
      if (dto[field] !== undefined) updateData[field] = dto[field];
    }
    if (dto.eventDate !== undefined) {
      updateData.eventDate = new Date(dto.eventDate);
    }

    // 5. Update
    const updatedInvitation = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: updateData,
      include: this.invitationInclude,
    });

    return this.mapInvitationResponse(updatedInvitation);
  }

  // ──────────────────────────────────────────────
  // Get invitation by slug (Public)
  // ──────────────────────────────────────────────

  async findBySlug(slug: string, userId?: string) {
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
        rsvps: {
          select: {
            name: true,
            message: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException(`errors.invitation_slug_not_found|${slug}`);
    }

    // Check if invitation is deactivated
    if (!invitation.isActive) {
      const isOwnerOrAdmin = await this.isOwnerOrAdmin(
        userId,
        invitation.purchase.userId,
      );

      if (!isOwnerOrAdmin) {
        throw new ForbiddenException('errors.invitation_deactivated');
      }
    }

    return this.mapInvitationResponse(invitation);
  }

  // ──────────────────────────────────────────────
  // Toggle activation status (Admin only)
  // ──────────────────────────────────────────────

  async toggleStatus(id: string, isActive: boolean) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      throw new NotFoundException(`errors.invitation_not_found|${id}`);
    }

    return this.prisma.invitation.update({
      where: { id },
      data: { isActive },
    });
  }

  // ──────────────────────────────────────────────
  // Get RSVPs for an invitation (Client only — owner)
  // ──────────────────────────────────────────────

  async findRsvps(invitationId: string, userId: string) {
    // 1. Find the invitation
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { purchase: true },
    });

    if (!invitation) {
      throw new NotFoundException(
        `errors.invitation_not_found|${invitationId}`,
      );
    }

    // 2. Ensure the client owns this invitation
    if (invitation.purchase.userId !== userId) {
      throw new ForbiddenException('errors.unauthorized_rsvp');
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
  // Add a moment (public/guest photo capture)
  // ──────────────────────────────────────────────

  async addMoment(invitationId: string, url: string, userId?: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { purchase: true },
    });

    if (!invitation) {
      throw new NotFoundException(
        `errors.invitation_not_found|${invitationId}`,
      );
    }

    // If guest uploads are disabled, only the owner can upload
    if (!invitation.allowGuestUploads) {
      if (!userId || invitation.purchase.userId !== userId) {
        throw new ForbiddenException('errors.guest_uploads_disabled');
      }
    }

    // Append URL to moments scalar list
    const updated = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: {
        moments: { push: url },
      },
      include: this.invitationInclude,
    });

    return this.mapInvitationResponse(updated);
  }

  // ──────────────────────────────────────────────
  // Private Helpers
  // ──────────────────────────────────────────────

  /**
   * Ensures a slug is available — checks both invitations table
   * and template demo links (reserved slugs).
   */
  private async ensureSlugAvailable(slug: string): Promise<void> {
    const existingSlug = await this.prisma.invitation.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new ConflictException(`errors.slug_taken|${slug}`);
    }

    // Check if slug conflicts with a template demo link
    // Optimized: query only templates whose demoLink ends with this slug
    const conflictingTemplate = await this.prisma.template.findFirst({
      where: {
        demoLink: { endsWith: `/${slug}` },
      },
      select: { id: true },
    });

    if (conflictingTemplate) {
      throw new ConflictException(`errors.slug_taken|${slug}`);
    }
  }

  /**
   * Checks if the given userId is the owner of the resource or an ADMIN.
   */
  private async isOwnerOrAdmin(
    userId: string | undefined,
    ownerId: string,
  ): Promise<boolean> {
    if (!userId) return false;
    if (userId === ownerId) return true;

    const caller = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return caller?.role === 'ADMIN';
  }

  /**
   * Maps database output to a clean API response structure.
   */
  private mapInvitationResponse(invitation: any) {
    const { purchase, rsvps, ...invitationFields } = invitation;
    return {
      ...invitationFields,
      userId: purchase?.userId,
      templateId: purchase?.templateId,
      template: purchase?.template,
      wishes: rsvps
        ? rsvps
            .filter((r: any) => r.message && r.message.trim() !== '')
            .map((r: any) => ({ name: r.name, text: r.message }))
        : [],
    };
  }
}
