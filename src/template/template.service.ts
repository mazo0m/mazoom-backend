import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto';

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
        titleAr: dto.titleAr,
        titleEn: dto.titleEn,
        description: dto.description,
        descriptionAr: dto.descriptionAr,
        descriptionEn: dto.descriptionEn,
        previewImage: dto.previewImage,
        price: dto.price,
        editableFields: dto.editableFields,
        demoLink: dto.demoLink,
        isPremium: dto.isPremium ?? false,
        isActive: true,
        category: dto.category,
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
      throw new NotFoundException(`errors.template_not_found|${id}`);
    }

    return template;
  }

  // ──────────────────────────────────────────────
  // Update Template (Admin only)
  // ──────────────────────────────────────────────

  async update(id: string, dto: UpdateTemplateDto) {
    const template = await this.prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`errors.template_not_found|${id}`);
    }

    return this.prisma.template.update({
      where: { id },
      data: {
        title: dto.title,
        titleAr: dto.titleAr,
        titleEn: dto.titleEn,
        description: dto.description,
        descriptionAr: dto.descriptionAr,
        descriptionEn: dto.descriptionEn,
        previewImage: dto.previewImage,
        price: dto.price,
        editableFields: dto.editableFields,
        demoLink: dto.demoLink,
        isPremium: dto.isPremium,
        isActive: dto.isActive,
        category: dto.category,
      },
    });
  }
}
