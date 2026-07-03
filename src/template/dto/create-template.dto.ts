import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTemplateDto {
  @ApiProperty({
    description: 'Display title of the invitation template',
    example: 'Royal Gold Wedding',
  })
  @IsString()
  @IsNotEmpty({ message: 'Template title is required' })
  title: string;

  @ApiProperty({
    description: 'Detailed description of the invitation template',
    example:
      'A luxurious gold-themed wedding invitation template with elegant animations.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @ApiProperty({
    description: 'Name or URL of the template preview image',
    example: '/images/royal-gold.jpg',
  })
  @IsString()
  @IsNotEmpty({ message: 'Preview image name or URL is required' })
  previewImage: string;

  @ApiProperty({
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
  price: number;

  @ApiProperty({
    description: 'Structured fields that can be edited in this template (JSON)',
    example: {
      eventTitle: { type: 'string', label: 'Event Title', default: 'My Event' },
      eventDate: { type: 'date', label: 'Event Date' },
    },
  })
  @IsNotEmpty({ message: 'Editable fields are required' })
  editableFields: any;

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
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isPremium must be a boolean value' })
  isPremium?: boolean;
}
