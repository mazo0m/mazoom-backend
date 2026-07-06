import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTestimonialDto {
  @ApiProperty({
    description: 'The purchase ID linked to this review/testimonial',
    example: 'd3b07384-d113-4ec2-a5d6-c87cd1d2e052',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'purchaseId must be a valid UUID' })
  @IsNotEmpty({ message: 'Purchase ID is required' })
  purchaseId: string;

  @ApiProperty({
    description: 'Rating out of 5 stars',
    example: 5,
  })
  @IsInt()
  @Min(1, { message: 'Rating must be at least 1 star' })
  @Max(5, { message: 'Rating cannot exceed 5 stars' })
  rating: number;

  @ApiProperty({
    description: 'Review comment/testimonial content',
    example: 'This was an excellent service, very happy!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Comment content is required' })
  @MaxLength(1000, { message: 'Comment must not exceed 1000 characters' })
  comment: string;
}
