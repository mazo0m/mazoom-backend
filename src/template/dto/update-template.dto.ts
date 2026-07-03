import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTemplateDto {
  @ApiPropertyOptional({
    description: 'Display title of the invitation template',
    example: 'Royal Gold Wedding',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Display title in Arabic',
    example: 'حفل الزفاف الذهبي الملكي',
  })
  @IsString()
  @IsOptional()
  titleAr?: string;

  @ApiPropertyOptional({
    description: 'Display title in English',
    example: 'Royal Gold Wedding',
  })
  @IsString()
  @IsOptional()
  titleEn?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the invitation template',
    example:
      'A luxurious gold-themed wedding invitation template with elegant animations.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Detailed description in Arabic',
    example: 'زفاف ملكي فاخر باللون الذهبي',
  })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiPropertyOptional({
    description: 'Detailed description in English',
    example: 'A luxurious gold-themed wedding invitation',
  })
  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @ApiPropertyOptional({
    description: 'Name or URL of the template preview image',
    example: '/images/royal-gold.jpg',
  })
  @IsString()
  @IsOptional()
  previewImage?: string;

  @ApiPropertyOptional({
    description: 'Price in SAR (max 2 decimal places)',
    example: 149.99,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Price must be a number with at most 2 decimal places' },
  )
  @Min(0, { message: 'Price must be a non-negative number' })
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    description: 'Structured fields that can be edited in this template (JSON)',
  })
  @IsOptional()
  editableFields?: any;

  @ApiPropertyOptional({
    description: 'URL of the live template demo page',
    example: 'https://demo.mazoom.app/royal-gold',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Demo link must be a valid URL' })
  demoLink?: string;

  @ApiPropertyOptional({
    description: 'Whether this is a premium template',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isPremium must be a boolean value' })
  isPremium?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this template is active and browsable',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean value' })
  isActive?: boolean;
}
