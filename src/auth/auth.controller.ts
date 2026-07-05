import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Creates a new CLIENT account and returns a JWT.
   */
  @Post('register')
  @ApiOperation({
    summary: 'Register a new account',
    description:
      'Creates a new CLIENT user and returns a JWT token for immediate authentication.',
  })
  @ApiResponse({
    status: 201,
    description: 'Account created successfully',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'c3a1e1d0-4f6a-4b2c-9e8f-1a2b3c4d5e6f',
          email: 'ahmed@mazoom.app',
          role: 'CLIENT',
          firstName: 'Ahmed',
          lastName: 'Al-Rashid',
          phoneNumber: '+966501234567',
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email or phone number already registered',
    schema: {
      example: {
        statusCode: 409,
        message: 'Email is already registered',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed — invalid input data',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /auth/login
   * Validates credentials and returns a JWT.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login to an existing account',
    description: 'Validates email and password, then returns a JWT token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'c3a1e1d0-4f6a-4b2c-9e8f-1a2b3c4d5e6f',
          email: 'ahmed@mazoom.app',
          role: 'CLIENT',
          firstName: 'Ahmed',
          lastName: 'Al-Rashid',
          phoneNumber: '+966501234567',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      },
    },
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * POST /auth/google
   * Validates Google credential token, registers/logs in the user and returns a JWT.
   */
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login or register with Google',
    description: 'Validates Google ID Token, creates user if they do not exist, and returns JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
  })
  googleLogin(@Body('token') token: string) {
    return this.authService.googleLogin(token);
  }
}
