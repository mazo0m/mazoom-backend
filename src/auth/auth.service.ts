import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;
  private readonly googleClient = new OAuth2Client();

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
    return await this.buildTokenResponse(user);
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
    if (!user.passwordHash) {
      throw new UnauthorizedException('errors.invalid_credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('errors.invalid_credentials');
    }

    // 3. Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('errors.user_deactivated');
    }

    // 4. Return JWT
    return await this.buildTokenResponse(user);
  }

  // ──────────────────────────────────────────────
  // Google Authentication
  // ──────────────────────────────────────────────

  async verifyGoogleToken(token: string) {
    // Mock / fallback configuration for local simulation/testing
    if (token && token.startsWith('mock_')) {
      const parts = token.split('_');
      return {
        email: parts[1] || 'mock@gmail.com',
        firstName: parts[2] || 'Google',
        lastName: parts[3] || 'User',
      };
    }

    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new Error('Invalid token payload');
      }
      return {
        email: payload.email,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
      };
    } catch (e) {
      throw new UnauthorizedException('errors.invalid_google_token');
    }
  }

  async googleLogin(token: string) {
    // 1. Verify Google token and get user details
    const googleUser = await this.verifyGoogleToken(token);

    // 2. Find if user exists by email
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      // 3. Create user if they don't exist
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          passwordHash: null,
          phoneNumber: null,
          role: 'CLIENT',
          isActive: true,
        },
      });
    } else {
      // Check if user is active
      if (!user.isActive) {
        throw new UnauthorizedException('errors.user_deactivated');
      }
    }

    // 4. Return JWT
    return await this.buildTokenResponse(user);
  }

  // ──────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────

  private generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async buildTokenResponse(user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
  }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as JwtPayload['role'],
    };

    // Short-lived access token (15 minutes)
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    // Generate a long-lived refresh token (7 days)
    const refreshToken = this.generateRefreshToken();
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Clean up expired tokens for this user to manage DB space
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        expiresAt: { lt: new Date() },
      },
    });

    // Save refresh token to database
    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
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

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('errors.invalid_refresh_token');
    }

    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('errors.invalid_refresh_token');
    }

    // Reuse detection
    if (storedToken.isRevoked) {
      // Invalidate all tokens for this user for security
      await this.prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('errors.refresh_token_reused');
    }

    // Expiry check
    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('errors.refresh_token_expired');
    }

    // User active check
    if (!storedToken.user.isActive) {
      throw new UnauthorizedException('errors.user_deactivated');
    }

    // Revoke old token as part of rotation
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Issue new access and refresh tokens
    return await this.buildTokenResponse(storedToken.user);
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return;

    const tokenHash = this.hashToken(refreshToken);

    try {
      await this.prisma.refreshToken.delete({
        where: { tokenHash },
      });
    } catch (e) {
      // Ignore if already deleted/invalid
    }
  }
}
