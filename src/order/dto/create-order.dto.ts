import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    description: 'UUID of the template to order',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'templateId must be a valid UUID' })
  @IsNotEmpty({ message: 'Template ID is required' })
  templateId: string;
}
