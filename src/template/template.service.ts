import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto';

@Injectable()
export class TemplateService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────
  // Create (Admin only)
  // ──────────────────────────────────────────────

  async create(dto: CreateTemplateDto) {
    const template = await this.prisma.template.create({
      data: {
        title: dto.title,
        description: dto.description,
        previewImage: dto.previewImage,
        price: dto.price,
        editableFields: dto.editableFields,
        demoLink: dto.demoLink,
        isPremium: dto.isPremium ?? false,
      },
    });

    return template;
  }

  // ──────────────────────────────────────────────
  // List all (Public)
  // ──────────────────────────────────────────────

  async findAll() {
    return this.prisma.template.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // ──────────────────────────────────────────────
  // Single template detail (Public)
  // ──────────────────────────────────────────────

  async findOne(id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID "${id}" not found`);
    }

    return template;
  }
}
