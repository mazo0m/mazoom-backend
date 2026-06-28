import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, GetUser } from '../auth/decorators';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';

@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * POST /orders
   * Creates a new order linked to the authenticated client. Client only.
   */
  @Post()
  @Roles(Role.CLIENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Create a new order',
    description:
      'Creates a new template order for the authenticated client. Requires CLIENT role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    schema: {
      example: {
        id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
        userId: 'c3a1e1d0-4f6a-4b2c-9e8f-1a2b3c4d5e6f',
        templateId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        status: 'PENDING',
        createdAt: '2025-09-01T12:00:00.000Z',
        template: {
          id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
          title: 'Royal Gold Wedding',
          thumbnailUrl: 'https://cdn.mazoom.app/templates/royal-gold.jpg',
          price: '149.99',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT' })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Template with ID "a1b2c3d4-..." not found',
        error: 'Not Found',
      },
    },
  })
  create(
    @GetUser('id') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.create(userId, dto);
  }

  /**
   * GET /orders/my-orders
   * Returns the authenticated client's own orders. Client only.
   *
   * NOTE: This route MUST be declared before the generic :id route
   * so that "my-orders" is not interpreted as a UUID param.
   */
  @Get('my-orders')
  @Roles(Role.CLIENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Get my orders',
    description:
      'Returns all orders belonging to the authenticated client, sorted by newest first.',
  })
  @ApiResponse({
    status: 200,
    description: "List of the client's orders",
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT' })
  findMyOrders(@GetUser('id') userId: string) {
    return this.orderService.findMyOrders(userId);
  }

  /**
   * GET /orders
   * Returns all orders from all users. Admin only.
   */
  @Get()
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Get all orders (Admin)',
    description:
      'Returns all orders from all users with user and template details. Requires ADMIN role.',
  })
  @ApiResponse({ status: 200, description: 'List of all orders' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN role' })
  findAll() {
    return this.orderService.findAll();
  }

  /**
   * PATCH /orders/:id/status
   * Updates an order's status to APPROVED or REJECTED. Admin only.
   */
  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Update order status (Admin)',
    description:
      'Approves or rejects a PENDING order. Only PENDING orders can be transitioned. Requires ADMIN role.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the order to update',
    example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
  })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
    schema: {
      example: {
        id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
        userId: 'c3a1e1d0-4f6a-4b2c-9e8f-1a2b3c4d5e6f',
        templateId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        status: 'APPROVED',
        createdAt: '2025-09-01T12:00:00.000Z',
        user: {
          id: 'c3a1e1d0-4f6a-4b2c-9e8f-1a2b3c4d5e6f',
          email: 'ahmed@mazoom.app',
          firstName: 'Ahmed',
          lastName: 'Al-Rashid',
        },
        template: {
          id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
          title: 'Royal Gold Wedding',
          price: '149.99',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Order has already been processed',
    schema: {
      example: {
        statusCode: 400,
        message:
          'Order has already been approved. Only PENDING orders can be updated.',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, dto);
  }
}
