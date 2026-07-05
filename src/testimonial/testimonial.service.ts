import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';

@Injectable()
export class TestimonialService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) { }

  // ──────────────────────────────────────────────
  // Create or Update Testimonial (Client only)
  // ──────────────────────────────────────────────
  async createOrUpdate(userId: string, dto: CreateTestimonialDto) {
    // 1. Verify purchase exists and belongs to this user
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: dto.purchaseId },
    });

    if (!purchase) {
      throw new NotFoundException(`errors.purchase_not_found|${dto.purchaseId}`);
    }

    if (purchase.userId !== userId) {
      throw new BadRequestException('errors.unauthorized_request');
    }

    // 2. Create or update testimonial
    const result = await this.prisma.testimonial.upsert({
      where: { purchaseId: dto.purchaseId },
      update: {
        rating: dto.rating,
        comment: dto.comment,
      },
      create: {
        purchaseId: dto.purchaseId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    // Invalidate testimonials cache
    await this.cacheManager.del('testimonials:all');

    return result;
  }

  // ──────────────────────────────────────────────
  // Get all Testimonials (Public)
  // ──────────────────────────────────────────────
  async findAll() {
    const cacheKey = 'testimonials:all';
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) return cached;

    const testimonials = await this.prisma.testimonial.findMany({
      include: {
        purchase: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            template: {
              select: {
                title: true,
              },
            },
            invitation: {
              select: {
                eventTitle: true,
                eventTitleAr: true,
                eventTitleEn: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map database models to standard landing page testimonial format
    const mapped = testimonials.map((t) => {
      const user = t.purchase.user;
      const firstName = user?.firstName || '';
      const lastName = user?.lastName || '';
      const clientName = `${firstName} ${lastName}`.trim() || 'Verified Client';

      // Create initials
      const firstInitial = firstName.charAt(0).toUpperCase();
      const lastInitial = lastName.charAt(0).toUpperCase();
      const clientInitials = firstInitial + lastInitial || 'VC';

      // Subtitle / event host fallback
      const invitation = t.purchase.invitation;
      const eventTitle =
        invitation?.eventTitle ||
        invitation?.eventTitleEn ||
        invitation?.eventTitleAr ||
        `${t.purchase.template.title} Client`;

      return {
        id: t.id,
        purchaseId: t.purchaseId,
        rating: t.rating,
        comment: t.comment,
        createdAt: t.createdAt,
        clientName,
        clientInitials,
        eventTitle,
      };
    });

    // Cache testimonials for 30 minutes (1,800,000 ms)
    await this.cacheManager.set(cacheKey, mapped, 1800000);

    return mapped;
  }
}

