import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurchaseService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────
  // Client's own purchases
  // ──────────────────────────────────────────────

  async findMyPurchases(userId: string) {
    return this.prisma.purchase.findMany({
      where: { userId },
      include: {
        template: {
          select: {
            id: true,
            title: true,
            previewImage: true,
            price: true,
          },
        },
        invitation: {
          select: {
            id: true,
            slug: true,
            eventTitle: true,
            eventDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ──────────────────────────────────────────────
  // All purchases (Admin only)
  // ──────────────────────────────────────────────

  async findAll() {
    return this.prisma.purchase.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
        template: {
          select: {
            id: true,
            title: true,
            previewImage: true,
            price: true,
          },
        },
        invitation: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
