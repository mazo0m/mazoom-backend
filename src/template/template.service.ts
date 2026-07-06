import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto';

@Injectable()
export class TemplateService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

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

    // Invalidate templates list caches
    await this.cacheManager.del('templates:all');
    await this.cacheManager.del('templates:active');

    return template;
  }

  // ──────────────────────────────────────────────
  // List all (Public)
  // ──────────────────────────────────────────────

  async findAll(includeInactive = false) {
    const cacheKey = includeInactive ? 'templates:all' : 'templates:active';
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) return cached;

    const templates = await this.prisma.template.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    // Cache list for 1 hour (3,600,000 ms)
    await this.cacheManager.set(cacheKey, templates, 3600000);

    return templates;
  }

  // ──────────────────────────────────────────────
  // Single template detail (Public)
  // ──────────────────────────────────────────────

  async findOne(id: string) {
    const cacheKey = `templates:id:${id}`;
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    const template = await this.prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`errors.template_not_found|${id}`);
    }

    // Cache template detail for 1 hour (3,600,000 ms)
    await this.cacheManager.set(cacheKey, template, 3600000);

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

    const updated = await this.prisma.template.update({
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

    // Invalidate caches
    await this.cacheManager.del('templates:all');
    await this.cacheManager.del('templates:active');
    await this.cacheManager.del(`templates:id:${id}`);

    return updated;
  }
}
