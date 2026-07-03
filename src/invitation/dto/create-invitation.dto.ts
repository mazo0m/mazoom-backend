import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({
    description: 'UUID of the template purchase to use for this invitation',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'purchaseId must be a valid UUID' })
  @IsNotEmpty({ message: 'Purchase ID is required' })
  purchaseId: string;

  @ApiProperty({
    description:
      'URL-friendly slug for the shareable link (e.g. mazoom.com/invite/ahmed-wedding)',
    example: 'ahmed-wedding',
  })
  @IsString()
  @IsNotEmpty({ message: 'Slug is required' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'Slug must be lowercase alphanumeric with hyphens only (e.g. "ahmed-wedding")',
  })
  slug: string;

  @ApiProperty({
    description: 'Title of the event or couple names',
    example: 'حفل زفاف أحمد وسارة',
  })
  @IsString()
  @IsNotEmpty({ message: 'Event title is required' })
  eventTitle: string;

  @ApiProperty({
    description: 'Location of the event (venue name or description)',
    example: 'قاعة الروابي - الرياض',
  })
  @IsString()
  @IsNotEmpty({ message: 'Event location is required' })
  eventLocation: string;

  @ApiProperty({
    description: 'Event date and time in ISO 8601 format',
    example: '2025-09-15T18:00:00.000Z',
  })
  @IsDateString({}, { message: 'eventDate must be a valid ISO 8601 date' })
  @IsNotEmpty({ message: 'Event date is required' })
  eventDate: string;

  @ApiPropertyOptional({
    description: 'Google Maps or venue URL for the event location',
    example: 'https://maps.google.com/?q=24.7136,46.6753',
  })
  @IsOptional()
  @IsUrl({}, { message: 'locationUrl must be a valid URL' })
  locationUrl?: string;

  @ApiPropertyOptional({
    description: 'Welcome / greeting message displayed on the invitation',
    example: 'يسرنا دعوتكم لحضور حفل زفاف أحمد وسارة',
  })
  @IsOptional()
  @IsString()
  welcomeText?: string;

  @ApiPropertyOptional({
    description: 'Array of image URLs to display in the invitation gallery',
    example: [
      'https://cdn.mazoom.app/img/photo1.jpg',
      'https://cdn.mazoom.app/img/photo2.jpg',
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'images must be an array of URLs' })
  @IsUrl({}, { each: true, message: 'Each image must be a valid URL' })
  images?: string[];

  @ApiPropertyOptional({
    description: 'Optional background music URL for the invitation page',
    example: 'https://cdn.mazoom.app/audio/wedding-nasheed.mp3',
  })
  @IsOptional()
  @IsUrl({}, { message: 'musicUrl must be a valid URL' })
  musicUrl?: string;

  @ApiPropertyOptional({
    description: 'Array of event program / timeline items',
    example: [
      { time: '8:00 م', title: 'الاستقبال' },
      { time: '9:00 م', title: 'العشاء' },
    ],
    type: 'array',
  })
  @IsOptional()
  @IsArray({ message: 'eventProgram must be an array' })
  eventProgram?: { time: string; title: string }[];

  @ApiPropertyOptional({
    description: 'Array of event detail / guideline items',
    example: [
      { text: 'الدخول عبر رمز QR فقط' },
      { text: 'يرجى تأكيد الحضور' },
    ],
    type: 'array',
  })
  @IsOptional()
  @IsArray({ message: 'eventDetails must be an array' })
  eventDetails?: { text: string }[];
}
