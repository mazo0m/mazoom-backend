import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from './s3.service';
import { detectMimeType, MIME_TO_EXT } from '../common/utils/file.utils';
import { randomUUID } from 'crypto';
import { MediaType } from '@prisma/client';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async uploadMedia(
    file: Express.Multer.File,
    context?: {
      userId?: string;
      invitationId?: string;
      templateId?: string;
      isGuestMoment?: boolean;
    },
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // 1. Detect MIME type using signature verification (magic bytes)
    const detectedMime = detectMimeType(file.buffer);
    if (!detectedMime) {
      throw new BadRequestException(
        'Upload failed: Unsupported or malicious file content detected.',
      );
    }

    // 2. Determine Media Type and Validate Limits
    let type: MediaType;
    let maxLimit: number;
    let fileCategory = 'images';

    if (['image/jpeg', 'image/png', 'image/webp'].includes(detectedMime)) {
      type = MediaType.IMAGE;
      maxLimit = 15 * 1024 * 1024; // 15MB limit for images
      fileCategory = 'images';
    } else if (['video/mp4', 'video/webm'].includes(detectedMime)) {
      type = MediaType.VIDEO;
      maxLimit = 50 * 1024 * 1024; // 50MB limit for videos
      fileCategory = 'videos';
    } else if (['audio/mpeg', 'audio/wav', 'audio/ogg'].includes(detectedMime)) {
      type = MediaType.AUDIO;
      maxLimit = 15 * 1024 * 1024; // 15MB limit for audio
      fileCategory = 'audio';
    } else {
      throw new BadRequestException(
        'Only jpeg, png, and webp images, mp4 and webm videos, and mp3, wav, and ogg audio files are allowed.',
      );
    }

    // Validate file size limit
    if (file.size > maxLimit) {
      const sizeMB = maxLimit / (1024 * 1024);
      throw new BadRequestException(
        `File size exceeds the allowed limit of ${sizeMB}MB for ${type.toLowerCase()}s.`,
      );
    }

    const safeExt = MIME_TO_EXT[detectedMime];
    if (!safeExt) {
      throw new BadRequestException('Could not determine safe file extension.');
    }

    // 3. Organise S3 object keys according to requirements
    const uuid = randomUUID();
    let key = '';

    if (context?.isGuestMoment) {
      const invId = context.invitationId || 'unknown';
      key = `guest-moments/${invId}/images/${uuid}${safeExt}`;
    } else if (context?.templateId) {
      key = `templates/${context.templateId}/${fileCategory}/${uuid}${safeExt}`;
    } else if (context?.invitationId) {
      key = `invitations/${context.invitationId}/${fileCategory}/${uuid}${safeExt}`;
    } else {
      const usrId = context?.userId || 'unknown';
      key = `users/${usrId}/${fileCategory}/${uuid}${safeExt}`;
    }

    // 4. Upload to S3
    const url = await this.s3Service.uploadFile(file.buffer, key, detectedMime);

    // 5. Save metadata to DB
    const media = await this.prisma.media.create({
      data: {
        url,
        key,
        type,
        mimeType: detectedMime,
        size: file.size,
      },
    });

    return media;
  }

  async deleteMedia(id: string): Promise<void> {
    // 1. Find in DB
    const media = await this.prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    // 2. Delete from S3
    await this.s3Service.deleteFile(media.key);

    // 3. Delete from DB
    await this.prisma.media.delete({
      where: { id },
    });
  }
}
