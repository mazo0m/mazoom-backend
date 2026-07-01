import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ──────────────────────────────────────────────
  // Registration
  // ──────────────────────────────────────────────

  async register(dto: RegisterDto) {
    // 1. Check if email is already taken
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingEmail) {
      throw new ConflictException('errors.email_registered');
    }

    // 2. Check if phone number is already taken
    const existingPhone = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (existingPhone) {
      throw new ConflictException('errors.phone_registered');
    }

    // 3. Hash the password
    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    // 4. Create the user (default role = CLIENT)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
      },
    });

    // 5. Return a JWT so the user is logged in immediately after registration
    return this.buildTokenResponse(user);
  }

  // ──────────────────────────────────────────────
  // Login
  // ──────────────────────────────────────────────

  async login(dto: LoginDto) {
    // 1. Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('errors.invalid_credentials');
    }

    // 2. Compare password with stored hash
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('errors.invalid_credentials');
    }

    // 3. Return JWT
    return this.buildTokenResponse(user);
  }

  // ──────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────

  private buildTokenResponse(user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as JwtPayload['role'],
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
      },
    };
  }
}
