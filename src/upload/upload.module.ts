import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { UploadController } from './upload.controller';

@Module({
  imports: [AuthModule, MediaModule],
  controllers: [UploadController],
})
export class UploadModule {}
