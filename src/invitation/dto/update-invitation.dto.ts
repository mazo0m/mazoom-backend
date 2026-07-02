import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateInvitationDto } from './create-invitation.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateInvitationDto extends PartialType(
  OmitType(CreateInvitationDto, ['purchaseId'] as const),
) {
  @ApiPropertyOptional({
    description: 'Whether this invitation link is active for guests',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean value' })
  isActive?: boolean;
}
