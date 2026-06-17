import { Injectable, BadRequestException } from '@nestjs/common';
import { generateSecret, generateURI, verify } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MfaService {
  constructor(private prisma: PrismaService) {}

  async setupMfa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (user.mfaEnabled) throw new BadRequestException('MFA already enabled');

    const secret = generateSecret();
    const otpauth = generateURI({ issuer: 'GoalNest', label: user.email, secret });
    const qrCode = await QRCode.toDataURL(otpauth);

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    return { secret, qrCode, otpauth };
  }

  async enableMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaSecret) throw new BadRequestException('MFA setup required first');

    const result = await verify({ token: code, secret: user.mfaSecret });
    if (!result.valid) throw new BadRequestException('Invalid MFA code');

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    return { success: true, mfaEnabled: true };
  }

  async disableMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaSecret || !user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    const result = await verify({ token: code, secret: user.mfaSecret });
    if (!result.valid) throw new BadRequestException('Invalid MFA code');

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null },
    });

    return { success: true, mfaEnabled: false };
  }

  async verifyCode(secret: string, code: string): Promise<boolean> {
    const result = await verify({ token: code, secret });
    return result.valid;
  }
}
