import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/guards';

/** Allowed MIME types for upload. */
const ALLOWED_MIME_REGEX = /^(image\/(jpg|jpeg|png|gif|webp)|audio\/(mpeg|mp3|wav|ogg))$/;

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
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadPath = './public/uploads';
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (_req, file, cb) => {
          // Use cryptographic random UUID instead of predictable Date.now()
          const uniqueName = randomUUID();
          // Sanitize extension — only allow alphanumeric extensions
          const ext = extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
          cb(null, `${uniqueName}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_REGEX.test(file.mimetype)) {
          return cb(
            new BadRequestException('Only images (jpg, png, gif, webp) and audio (mp3, wav, ogg) files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
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
    // Return relative path prefixed by static assets middleware
    return { url: `/public/uploads/${file.filename}` };
  }
}
