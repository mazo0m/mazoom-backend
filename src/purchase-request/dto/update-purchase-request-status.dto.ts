import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { RequestStatus } from '@prisma/client';

export class UpdatePurchaseRequestStatusDto {
  @ApiProperty({
    description: 'Status of the purchase request',
    enum: RequestStatus,
    example: RequestStatus.APPROVED,
  })
  @IsEnum(RequestStatus, {
    message: 'status must be either PENDING, APPROVED, or REJECTED',
  })
  @IsNotEmpty({ message: 'Status is required' })
  status: RequestStatus;
}
