import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateInvitationDto } from './create-invitation.dto';

/**
 * All fields from CreateInvitationDto become optional,
 * except `templateId` which is excluded (cannot be changed post-creation).
 */
export class UpdateInvitationDto extends PartialType(
  OmitType(CreateInvitationDto, ['templateId'] as const),
) {}
