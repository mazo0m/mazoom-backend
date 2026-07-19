import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddMomentDto {
  @ApiProperty({
    description: 'URL or path of the photo/moment to add',
    example: '/public/uploads/moment-1234.jpg',
  })
  @IsString({ message: 'URL must be a string' })
  @IsNotEmpty({ message: 'Photo URL is required' })
  @MaxLength(500, { message: 'Photo URL must not exceed 500 characters' })
  url: string;
}
