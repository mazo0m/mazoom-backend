import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { join } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/guards';
import { detectMimeType, MIME_TO_EXT } from '../common/utils/file.utils';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Upload a file (images or audio)',
    description:
      'Uploads an image or audio file to the server. ' +
      'Returns the public URL path. Requires authentication.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — missing or invalid JWT',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB limit
      },
    }),
  )
  uploadFile(
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // 1. Detect dynamic MIME type using signature verification (magic bytes)
    const detectedMime = detectMimeType(file.buffer);
    if (!detectedMime) {
      throw new BadRequestException(
        'Upload failed: Unsupported or malicious file content detected.',
      );
    }

    // 2. Force safe file extension based entirely on verified type (ignoring client orig name)
    const safeExt = MIME_TO_EXT[detectedMime];
    if (!safeExt) {
      throw new BadRequestException('Only images and audio files are allowed');
    }

    // 3. Write file securely to public folder
    const uniqueName = randomUUID();
    const filename = `${uniqueName}${safeExt}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');

    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = join(uploadDir, filename);
    writeFileSync(filePath, file.buffer);

    // Return relative path prefixed by static assets middleware
    return { url: `/public/uploads/${filename}` };
  }
}
