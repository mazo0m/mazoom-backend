import {
  ConflictException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { User, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto, UpdateUserByAdminDto } from './dto/admin-user.dto';
import { AuditLogService } from '../common/services/audit-log.service';

/** User fields safe to return in API responses (excludes passwordHash). */
type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UserService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly auditLogService: AuditLogService,
  ) { }


  // ──────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────

  /**
   * Strips the passwordHash from a user object before returning to the client.
   * Extracted to eliminate repeated `delete (obj as any).passwordHash` pattern.
   */
  private excludePassword(user: User): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Validates that email and phone number are unique across users.
   * Throws ConflictException if either is already taken by another user.
   *
   * @param email - New email to check (optional)
   * @param phoneNumber - New phone number to check (optional)
   * @param excludeUserId - User ID to exclude from checks (for updates)
   */
  private async validateUniqueFields(
    email?: string,
    phoneNumber?: string,
    excludeUserId?: string,
  ): Promise<void> {
    if (email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail && existingEmail.id !== excludeUserId) {
        throw new ConflictException('errors.email_registered');
      }
    }

    if (phoneNumber) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phoneNumber },
      });
      if (existingPhone && existingPhone.id !== excludeUserId) {
        throw new ConflictException('errors.phone_registered');
      }
    }
  }

  /**
   * Hashes a plaintext password using bcrypt.
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  // ──────────────────────────────────────────────
  // Profile (Authenticated User)
  // ──────────────────────────────────────────────

  /**
   * Fetch profile of an authenticated user.
   */
  async getProfile(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('errors.user_not_found');
    }

    return this.excludePassword(user);
  }

  /**
   * Update profile fields of the user. Checks for duplicates on email/phone.
   */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    ip?: string,
    userAgent?: string,
  ): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('errors.user_not_found');
    }

    // Validate uniqueness only for changed fields
    await this.validateUniqueFields(
      dto.email !== user.email ? dto.email : undefined,
      dto.phoneNumber !== user.phoneNumber ? dto.phoneNumber : undefined,
      userId,
    );

    const updateData: Prisma.UserUpdateInput = {};

    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.email && dto.email !== user.email) updateData.email = dto.email;
    if (dto.phoneNumber && dto.phoneNumber !== user.phoneNumber) {
      updateData.phoneNumber = dto.phoneNumber;
    }
    if (dto.password) {
      updateData.passwordHash = await this.hashPassword(dto.password);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    await this.cacheManager.del(`users:id:${userId}`);

    if (dto.password) {
      await this.auditLogService.logPasswordChange(userId, ip || 'unknown', userAgent || 'unknown');
    }

    return this.excludePassword(updatedUser);
  }

  // ──────────────────────────────────────────────
  // Admin User Management
  // ──────────────────────────────────────────────

  /**
   * Fetch all registered users (Admin only). Excludes passwordHash.
   */
  async findAll(): Promise<SafeUser[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map((user) => this.excludePassword(user));
  }

  /**
   * Create a new user with any role (Admin only).
   */
  async createUserByAdmin(dto: CreateUserDto): Promise<SafeUser> {
    await this.validateUniqueFields(dto.email, dto.phoneNumber);

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        role: dto.role,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    return this.excludePassword(user);
  }

  /**
   * Update details/role of a user by ID (Admin only).
   */
  async updateUserByAdmin(
    id: string,
    dto: UpdateUserByAdminDto,
    ip?: string,
    userAgent?: string,
  ): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('errors.user_not_found');
    }

    // Validate uniqueness only for changed fields
    await this.validateUniqueFields(
      dto.email !== user.email ? dto.email : undefined,
      dto.phoneNumber !== user.phoneNumber ? dto.phoneNumber : undefined,
      id,
    );

    const updateData: Prisma.UserUpdateInput = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.email && dto.email !== user.email) updateData.email = dto.email;
    if (dto.phoneNumber && dto.phoneNumber !== user.phoneNumber) {
      updateData.phoneNumber = dto.phoneNumber;
    }
    if (dto.password) {
      updateData.passwordHash = await this.hashPassword(dto.password);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    await this.cacheManager.del(`users:id:${id}`);

    if (dto.password) {
      await this.auditLogService.logPasswordChange(id, ip || 'unknown', userAgent || 'unknown');
    }

    return this.excludePassword(updated);
  }
}
