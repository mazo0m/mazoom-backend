import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

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
  guestName: string;

  @ApiProperty({
    description: 'Whether the guest will attend the event',
    example: true,
  })
  @IsBoolean({ message: 'willAttend must be a boolean (true/false)' })
  willAttend: boolean;

  @ApiProperty({
    description: 'Number of additional companions the guest will bring',
    example: 2,
    minimum: 0,
  })
  @IsInt({ message: 'companionsCount must be an integer' })
  @Min(0, { message: 'companionsCount cannot be negative' })
  companionsCount: number;
}
