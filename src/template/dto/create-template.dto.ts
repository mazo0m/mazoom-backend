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
    description: 'URL of the template thumbnail preview image',
    example: 'https://cdn.mazoom.app/templates/royal-gold.jpg',
  })
  @IsUrl({}, { message: 'Thumbnail URL must be a valid URL' })
  @IsNotEmpty({ message: 'Thumbnail URL is required' })
  thumbnailUrl: string;

  @ApiProperty({
    description: 'URL of the live template demo page',
    example: 'https://demo.mazoom.app/royal-gold',
  })
  @IsUrl({}, { message: 'Demo link must be a valid URL' })
  @IsNotEmpty({ message: 'Demo link is required' })
  demoLink: string;

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

  @ApiPropertyOptional({
    description: 'Whether this is a premium template',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isPremium must be a boolean value' })
  isPremium?: boolean;
}
