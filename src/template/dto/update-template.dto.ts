import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateTemplateDto } from './create-template.dto';

/**
 * All fields from CreateTemplateDto are optional for updates.
 * `isActive` is an additional field only available during updates.
 */
export class UpdateTemplateDto extends PartialType(CreateTemplateDto) {
  @ApiPropertyOptional({
    description: 'Whether this template is active and browsable',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean value' })
  isActive?: boolean;
}
