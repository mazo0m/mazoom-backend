import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RsvpService } from './rsvp.service';
import { CreateRsvpDto } from './dto';

@ApiTags('RSVPs')
@Controller('rsvps')
export class RsvpController {
  constructor(private readonly rsvpService: RsvpService) {}

  /**
   * POST /rsvps
   * Public endpoint — allows any guest to submit their RSVP.
   */
  @Post()
  @ApiOperation({
    summary: 'Submit an RSVP (Public)',
    description:
      'Allows any guest to submit their RSVP response to an invitation. ' +
      'No authentication required.',
  })
  @ApiResponse({
    status: 201,
    description: 'RSVP submitted successfully',
    schema: {
      example: {
        id: 'a1b2c3d4-5678-4abc-def0-123456789abc',
        invitationId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        guestName: 'محمد العلي',
        willAttend: true,
        companionsCount: 2,
        createdAt: '2025-09-05T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Invitation with ID "f47ac10b-..." not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation failed — invalid input data' })
  create(@Body() dto: CreateRsvpDto) {
    return this.rsvpService.create(dto);
  }
}
