import { Body, Controller, Delete, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { GetUser } from '../auth/decorators';
import { Throttle } from '@nestjs/throttler';
import * as express from 'express';
import { RsvpService } from './rsvp.service';
import { CreateRsvpDto } from './dto';
import { AbuseService } from '../common/services/abuse.service';

@ApiTags('RSVPs')
@Controller('rsvp')
export class RsvpController {
  constructor(
    private readonly rsvpService: RsvpService,
    private readonly abuseService: AbuseService,
  ) {}

  /**
   * POST /rsvp
   * Public endpoint — allows any guest to submit their RSVP.
   */
  @Throttle({ default: { ttl: 60000, limit: 10 } })
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
        name: 'محمد العلي',
        attendance: 'YES',
        guestsCount: 2,
        message: 'ألف مبروك! نسعد بحضور حفلكم الكريم.',
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
  @ApiResponse({
    status: 400,
    description: 'Validation failed — invalid input data',
  })
  create(@Body() dto: CreateRsvpDto, @Req() req: express.Request) {
    const ip = this.abuseService.extractIp(req);
    const idempotencyKey = req.headers['x-idempotency-key']?.toString();
    return this.rsvpService.create(dto, ip, idempotencyKey);
  }

  /**
   * PATCH /rsvp/:id/toggle-hide
   * Client (owner) or Admin only.
   */
  @Patch(':id/toggle-hide')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Toggle RSVP visibility (Client/Admin)',
    description: 'Toggles isHidden property of a guest RSVP. Requires JWT token.',
  })
  @ApiResponse({
    status: 200,
    description: 'RSVP visibility toggled successfully',
  })
  toggleHide(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
  ) {
    return this.rsvpService.toggleHide(id, userId, userRole);
  }

  /**
   * DELETE /rsvp/:id
   * Client (owner) or Admin only.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Soft delete an RSVP (Client/Admin)',
    description: 'Sets isDeleted to true for a guest RSVP. Requires JWT token.',
  })
  @ApiResponse({
    status: 200,
    description: 'RSVP soft-deleted successfully',
  })
  softDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
  ) {
    return this.rsvpService.softDelete(id, userId, userRole);
  }
}
