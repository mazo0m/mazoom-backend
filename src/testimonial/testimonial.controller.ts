import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles, GetUser } from '../auth/decorators';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { CreateTestimonialDto } from './dto';
import { TestimonialService } from './testimonial.service';

@ApiTags('Testimonials')
@Controller('testimonials')
export class TestimonialController {
  constructor(private readonly testimonialService: TestimonialService) {}

  /**
   * POST /testimonials
   * Create or update a testimonial for a purchase. Client only.
   */
  @Post()
  @Roles(Role.CLIENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create or update order testimonial',
    description:
      'Clients can rate and comment on services from their approved purchases.',
  })
  @ApiResponse({
    status: 201,
    description: 'Testimonial created/updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or unauthorized purchase ownership',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — missing or invalid JWT',
  })
  createOrUpdate(
    @GetUser('id') userId: string,
    @Body() dto: CreateTestimonialDto,
  ) {
    return this.testimonialService.createOrUpdate(userId, dto);
  }

  /**
   * GET /testimonials
   * Get all testimonials for public landing page display. Public endpoint.
   */
  @Get()
  @ApiOperation({
    summary: 'Get all testimonials',
    description:
      'Returns all testimonials mapped with client information for public display.',
  })
  @ApiResponse({ status: 200, description: 'List of testimonials' })
  findAll() {
    return this.testimonialService.findAll();
  }

  /**
   * GET /testimonials/admin
   * Get all testimonials for admin management. Admin only.
   */
  @Get('admin')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all testimonials for admin',
    description: 'Returns all testimonials with full user and template details. Requires ADMIN role.',
  })
  @ApiResponse({ status: 200, description: 'List of testimonials' })
  findAllAdmin() {
    return this.testimonialService.findAllAdmin();
  }

  /**
   * DELETE /testimonials/:id
   * Delete a testimonial by ID. Admin only.
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a testimonial (Admin)',
    description: 'Deletes a client testimonial. Requires ADMIN role.',
  })
  @ApiResponse({ status: 200, description: 'Testimonial deleted successfully' })
  @ApiResponse({ status: 404, description: 'Testimonial not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.testimonialService.remove(id);
  }
}
