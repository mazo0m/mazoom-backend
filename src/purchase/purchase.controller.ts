import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, GetUser } from '../auth/decorators';
import { PurchaseService } from './purchase.service';

@ApiTags('Purchases')
@ApiBearerAuth('JWT-auth')
@Controller('purchases')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  /**
   * GET /purchases/my-purchases
   * Returns authenticated client's purchases. Client only.
   */
  @Get('my-purchases')
  @Roles(Role.CLIENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Get my purchases',
    description:
      'Returns all purchased template records belonging to the authenticated client, sorted by newest first.',
  })
  @ApiResponse({ status: 200, description: "List of client's purchases" })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT' })
  findMyPurchases(@GetUser('id') userId: string) {
    return this.purchaseService.findMyPurchases(userId);
  }

  /**
   * GET /purchases
   * Returns all purchases. Admin only.
   */
  @Get()
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Get all purchases (Admin)',
    description:
      'Returns all template purchase records from all users. Requires ADMIN role.',
  })
  @ApiResponse({ status: 200, description: 'List of all purchases' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN role' })
  findAll() {
    return this.purchaseService.findAll();
  }
}
