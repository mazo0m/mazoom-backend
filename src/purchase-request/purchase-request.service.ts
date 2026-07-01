import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RequestStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePurchaseRequestDto,
  UpdatePurchaseRequestStatusDto,
} from './dto';

@Injectable()
export class PurchaseRequestService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────
  // Create Purchase Request (Client only)
  // ──────────────────────────────────────────────

  async create(userId: string, dto: CreatePurchaseRequestDto) {
    // 1. Verify template exists
    const template = await this.prisma.template.findUnique({
      where: { id: dto.templateId },
    });

    if (!template) {
      throw new NotFoundException(
        `errors.template_not_found|${dto.templateId}`,
      );
    }

    // 2. Create purchase request
    const request = await this.prisma.purchaseRequest.create({
      data: {
        userId,
        templateId: dto.templateId,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        status: RequestStatus.PENDING,
      },
      include: {
        template: {
          select: {
            id: true,
            title: true,
            previewImage: true,
            price: true,
          },
        },
      },
    });

    return request;
  }

  // ──────────────────────────────────────────────
  // Client's own purchase requests
  // ──────────────────────────────────────────────

  async findMyRequests(userId: string) {
    return this.prisma.purchaseRequest.findMany({
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ──────────────────────────────────────────────
  // All purchase requests (Admin only)
  // ──────────────────────────────────────────────

  async findAll() {
    return this.prisma.purchaseRequest.findMany({
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ──────────────────────────────────────────────
  // Update status (Admin only)
  // ──────────────────────────────────────────────

  async updateStatus(id: string, dto: UpdatePurchaseRequestStatusDto) {
    // 1. Find the purchase request
    const request = await this.prisma.purchaseRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`errors.purchase_request_not_found|${id}`);
    }

    // 2. Only PENDING requests can be transitioned
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        `errors.purchase_request_processed|${request.status.toLowerCase()}`,
      );
    }

    // 3. Process status update in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Update request status
      const updatedRequest = await tx.purchaseRequest.update({
        where: { id },
        data: { status: dto.status },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          template: {
            select: {
              id: true,
              title: true,
              price: true,
            },
          },
        },
      });

      // If approved, create a Purchase record
      if (dto.status === RequestStatus.APPROVED) {
        const slug = `invite-${randomUUID().substring(0, 8)}`;
        await tx.purchase.create({
          data: {
            userId: request.userId,
            templateId: request.templateId,
            purchaseRequestId: request.id,
            slug,
          },
        });
      }

      return updatedRequest;
    });
  }
}
