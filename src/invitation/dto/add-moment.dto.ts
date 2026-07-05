import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddMomentDto {
  @ApiProperty({
    description: 'URL or path of the photo/moment to add',
    example: '/public/uploads/moment-1234.jpg',
  })
  @IsString({ message: 'URL must be a string' })
  @IsNotEmpty({ message: 'Photo URL is required' })
  url: string;
}
