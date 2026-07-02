import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto, UpdateUserByAdminDto } from './dto/admin-user.dto';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({
    summary: "Get the current user's profile details",
    description:
      'Retrieves the full profile details for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile details retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — missing or invalid JWT token',
  })
  getProfile(@GetUser('id') userId: string) {
    return this.userService.getProfile(userId);
  }

  @Put('profile')
  @ApiOperation({
    summary: "Update the current user's profile details",
    description:
      'Updates fields like names, email, phone, and password for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — missing or invalid JWT token',
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflict — email or phone number already in use by another account',
  })
  updateProfile(@GetUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(userId, dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Get all users (Admin)',
    description:
      'Returns a list of all registered users on the platform. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all users retrieved successfully',
  })
  findAll() {
    return this.userService.findAll();
  }

  @Post()
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Create a user (Admin)',
    description:
      'Creates a new user account with client or admin role. Requires ADMIN role.',
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  createUser(@Body() dto: CreateUserDto) {
    return this.userService.createUserByAdmin(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Update a user (Admin)',
    description:
      'Updates registration details or role of a user. Requires ADMIN role.',
  })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserByAdminDto,
  ) {
    return this.userService.updateUserByAdmin(id, dto);
  }
}
