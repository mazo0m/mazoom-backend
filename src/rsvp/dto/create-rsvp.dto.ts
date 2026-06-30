import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { RsvpAttendance } from '@prisma/client';

export class CreateRsvpDto {
  @ApiProperty({
    description: 'UUID of the invitation this RSVP belongs to',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'invitationId must be a valid UUID' })
  @IsNotEmpty({ message: 'Invitation ID is required' })
  invitationId: string;

  @ApiProperty({
    description: 'Full name of the guest',
    example: 'محمد العلي',
  })
  @IsString()
  @IsNotEmpty({ message: 'Guest name is required' })
  name: string;

  @ApiProperty({
    description: 'Whether the guest will attend the event (YES / NO)',
    enum: RsvpAttendance,
    example: RsvpAttendance.YES,
  })
  @IsEnum(RsvpAttendance, {
    message: 'attendance must be either YES or NO',
  })
  @IsNotEmpty({ message: 'Attendance status is required' })
  attendance: RsvpAttendance;

  @ApiProperty({
    description: 'Number of additional guests/companions the guest will bring',
    example: 2,
    minimum: 0,
  })
  @IsInt({ message: 'guestsCount must be an integer' })
  @Min(0, { message: 'guestsCount cannot be negative' })
  guestsCount: number;

  @ApiPropertyOptional({
    description: 'Optional personal message or note for the host',
    example: 'ألف مبروك! نسعد بحضور حفلكم الكريم.',
  })
  @IsOptional()
  @IsString()
  message?: string;
}
