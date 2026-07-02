import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto, UpdateUserByAdminDto } from './dto/admin-user.dto';

@Injectable()
export class UserService {
  private readonly SALT_ROUNDS = 10;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch profile of an authenticated user.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('errors.user_not_found');
    }

    const profile = { ...user };
    delete (profile as any).passwordHash;
    return profile;
  }

  /**
   * Update profile fields of the user. Checks for duplicates on email/phone.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('errors.user_not_found');
    }

    const updateData: any = {};

    if (dto.firstName) {
      updateData.firstName = dto.firstName;
    }
    if (dto.lastName) {
      updateData.lastName = dto.lastName;
    }

    // Check if new email is already registered by another user
    if (dto.email && dto.email !== user.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('errors.email_registered');
      }
      updateData.email = dto.email;
    }

    // Check if new phone is already registered by another user
    if (dto.phoneNumber && dto.phoneNumber !== user.phoneNumber) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phoneNumber: dto.phoneNumber },
      });
      if (existingPhone) {
        throw new ConflictException('errors.phone_registered');
      }
      updateData.phoneNumber = dto.phoneNumber;
    }

    // Hash the password if it's being updated
    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(
        dto.password,
        this.SALT_ROUNDS,
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const profile = { ...updatedUser };
    delete (profile as any).passwordHash;
    return profile;
  }

  /**
   * Fetch all registered users (Admin only). Excludes passwordHash.
   */
  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map((user) => {
      const u = { ...user };
      delete (u as any).passwordHash;
      return u;
    });
  }

  /**
   * Create a new user with any role (Admin only).
   */
  async createUserByAdmin(dto: CreateUserDto) {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('errors.email_registered');
    }

    const existingPhone = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });
    if (existingPhone) {
      throw new ConflictException('errors.phone_registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        role: dto.role,
      },
    });

    const result = { ...user };
    delete (result as any).passwordHash;
    return result;
  }

  /**
   * Update details/role of a user by ID (Admin only).
   */
  async updateUserByAdmin(id: string, dto: UpdateUserByAdminDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('errors.user_not_found');
    }

    const updateData: any = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.role !== undefined) updateData.role = dto.role;

    if (dto.email && dto.email !== user.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('errors.email_registered');
      }
      updateData.email = dto.email;
    }

    if (dto.phoneNumber && dto.phoneNumber !== user.phoneNumber) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phoneNumber: dto.phoneNumber },
      });
      if (existingPhone) {
        throw new ConflictException('errors.phone_registered');
      }
      updateData.phoneNumber = dto.phoneNumber;
    }

    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(
        dto.password,
        this.SALT_ROUNDS,
      );
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    const result = { ...updated };
    delete (result as any).passwordHash;
    return result;
  }
}
