import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────
  // Create order (Client only)
  // ──────────────────────────────────────────────

  async create(userId: string, dto: CreateOrderDto) {
    // 1. Verify the template exists
    const template = await this.prisma.template.findUnique({
      where: { id: dto.templateId },
    });

    if (!template) {
      throw new NotFoundException(
        `Template with ID "${dto.templateId}" not found`,
      );
    }

    // 2. Create the order with default PENDING status
    const order = await this.prisma.order.create({
      data: {
        userId,
        templateId: dto.templateId,
        status: OrderStatus.PENDING,
      },
      include: {
        template: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            price: true,
          },
        },
      },
    });

    return order;
  }

  // ──────────────────────────────────────────────
  // Client's own orders
  // ──────────────────────────────────────────────

  async findMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        template: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ──────────────────────────────────────────────
  // All orders (Admin only)
  // ──────────────────────────────────────────────

  async findAll() {
    return this.prisma.order.findMany({
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
            thumbnailUrl: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ──────────────────────────────────────────────
  // Update order status (Admin only)
  // ──────────────────────────────────────────────

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto) {
    // 1. Find the order
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found`);
    }

    // 2. Only PENDING orders can be transitioned
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Order has already been ${order.status.toLowerCase()}. Only PENDING orders can be updated.`,
      );
    }

    // 3. Update the status
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
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

    return updatedOrder;
  }
}
