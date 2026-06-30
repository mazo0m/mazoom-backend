import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
      throw new NotFoundException('User not found');
    }

    const { passwordHash, ...profile } = user;
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
      throw new NotFoundException('User not found');
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
        throw new ConflictException('Email is already registered');
      }
      updateData.email = dto.email;
    }

    // Check if new phone is already registered by another user
    if (dto.phoneNumber && dto.phoneNumber !== user.phoneNumber) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phoneNumber: dto.phoneNumber },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number is already registered');
      }
      updateData.phoneNumber = dto.phoneNumber;
    }

    // Hash the password if it's being updated
    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const { passwordHash, ...profile } = updatedUser;
    return profile;
  }
}
