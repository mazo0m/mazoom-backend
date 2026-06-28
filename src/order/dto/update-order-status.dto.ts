import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'New status for the order',
    enum: ['APPROVED', 'REJECTED'],
    example: 'APPROVED',
  })
  @IsString()
  @IsNotEmpty({ message: 'Status is required' })
  @IsIn(['APPROVED', 'REJECTED'], {
    message: 'Status must be either APPROVED or REJECTED',
  })
  status: 'APPROVED' | 'REJECTED';
}
