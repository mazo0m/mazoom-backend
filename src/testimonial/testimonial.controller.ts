import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
    description: 'Clients can rate and comment on services from their approved purchases.',
  })
  @ApiResponse({ status: 201, description: 'Testimonial created/updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or unauthorized purchase ownership' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT' })
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
    description: 'Returns all testimonials mapped with client information for public display.',
  })
  @ApiResponse({ status: 200, description: 'List of testimonials' })
  findAll() {
    return this.testimonialService.findAll();
  }
}
