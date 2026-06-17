import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { toMinorUnits } from '../../common/utils/money.util';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        mobileNumber: true,
        country: true,
        currency: true,
        monthlySalary: true,
        salaryFrequency: true,
        financialDependents: true,
        maritalStatus: true,
        financialPreferences: true,
        planTier: true,
        role: true,
        mfaEnabled: true,
        avatarUrl: true,
        timezone: true,
        locale: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { monthlySalary, ...rest } = dto;
    const updateData: Record<string, unknown> = { ...rest };
    if (monthlySalary !== undefined) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      updateData.monthlySalary = toMinorUnits(monthlySalary, user?.currency ?? 'INR');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        mobileNumber: true,
        country: true,
        currency: true,
        monthlySalary: true,
        salaryFrequency: true,
        financialDependents: true,
        maritalStatus: true,
        financialPreferences: true,
      },
    });
  }

  async getDevices(userId: string) {
    return this.prisma.device.findMany({
      where: { userId, deletedAt: null },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async revokeDevice(userId: string, deviceId: string) {
    await this.prisma.device.updateMany({
      where: { id: deviceId, userId },
      data: { deletedAt: new Date() },
    });
    await this.prisma.refreshToken.updateMany({
      where: { deviceId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }
}
