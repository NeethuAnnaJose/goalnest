import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, ResetPasswordDto } from './dto/auth.dto';
import { AppleLoginDto, GoogleMobileLoginDto } from './dto/oauth.dto';
import { MfaService } from './mfa.service';
import { AuthProvider } from '@prisma/client';
import { getSignupPlanTier } from '../../config/billing.config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mfaService: MfaService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        planTier: getSignupPlanTier(),
        profile: { create: {} },
      },
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    if (!user?.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.mfaEnabled) {
      const tempToken = this.jwt.sign(
        { sub: user.id, mfaPending: true },
        { secret: this.config.get('JWT_SECRET'), expiresIn: '5m' },
      );
      return { mfaRequired: true, tempToken };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    if (dto.deviceName) {
      await this.prisma.device.create({
        data: {
          userId: user.id,
          deviceName: dto.deviceName,
          deviceType: dto.deviceType ?? 'web',
          ipAddress: ip,
          userAgent,
        },
      });
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
    if (!stored || stored.user.deletedAt) throw new UnauthorizedException('Invalid refresh token');

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(stored.user.id, stored.user.email, stored.user.role);
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (!user) return { message: 'If the email exists, a reset link has been sent' };

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    // Email would be sent via notification service
    return { message: 'If the email exists, a reset link has been sent', resetToken: token };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token);
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!resetToken) throw new BadRequestException('Invalid or expired token');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Password reset successful' };
  }

  async verifyMfa(code: string, tempToken: string) {
    let payload: { sub: string; mfaPending?: boolean };
    try {
      payload = this.jwt.verify(tempToken, { secret: this.config.get('JWT_SECRET') });
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA session');
    }
    if (!payload.mfaPending) throw new UnauthorizedException('Invalid MFA session');

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
    });
    if (!user?.mfaSecret) throw new UnauthorizedException('MFA not configured');

    const valid = await this.mfaService.verifyCode(user.mfaSecret, code);
    if (!valid) throw new UnauthorizedException('Invalid MFA code');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  async googleLogin(profile: {
    googleId: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  }) {
    return this.oauthLogin({
      provider: AuthProvider.GOOGLE,
      providerId: profile.googleId,
      idField: 'googleId',
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
    });
  }

  async googleMobileLogin(dto: GoogleMobileLoginDto) {
    const payload = this.decodeJwtPayload(dto.idToken);
    if (!payload?.sub || !payload?.email) {
      throw new BadRequestException('Invalid Google ID token');
    }
    return this.oauthLogin({
      provider: AuthProvider.GOOGLE,
      providerId: payload.sub,
      idField: 'googleId',
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.picture,
      deviceName: dto.deviceName,
      deviceType: dto.deviceType,
    });
  }

  async appleLogin(dto: AppleLoginDto) {
    const payload = this.decodeJwtPayload(dto.identityToken);
    if (!payload?.sub) throw new BadRequestException('Invalid Apple identity token');

    const email = payload.email;
    if (!email) throw new BadRequestException('Apple account must share email on first sign-in');

    return this.oauthLogin({
      provider: AuthProvider.APPLE,
      providerId: payload.sub,
      idField: 'appleId',
      email,
      name: dto.name,
      deviceName: dto.deviceName,
      deviceType: dto.deviceType,
    });
  }

  private async oauthLogin(params: {
    provider: AuthProvider;
    providerId: string;
    idField: 'googleId' | 'appleId';
    email: string;
    name?: string;
    avatarUrl?: string;
    deviceName?: string;
    deviceType?: string;
  }) {
    let user = await this.prisma.user.findFirst({
      where: { [params.idField]: params.providerId, deletedAt: null },
    });

    if (!user) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: params.email },
      });
      if (existingEmail) {
        user = await this.prisma.user.update({
          where: { id: existingEmail.id },
          data: {
            [params.idField]: params.providerId,
            authProvider: params.provider,
            emailVerified: true,
            name: params.name ?? existingEmail.name,
            avatarUrl: params.avatarUrl ?? existingEmail.avatarUrl,
          },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            email: params.email,
            name: params.name,
            avatarUrl: params.avatarUrl,
            authProvider: params.provider,
            [params.idField]: params.providerId,
            emailVerified: true,
            planTier: getSignupPlanTier(),
            profile: { create: {} },
          },
        });
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    if (params.deviceName) {
      await this.prisma.device.create({
        data: {
          userId: user.id,
          deviceName: params.deviceName,
          deviceType: params.deviceType ?? 'mobile',
        },
      });
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  private decodeJwtPayload(token: string): Record<string, string> | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      return JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    } catch {
      return null;
    }
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(refreshToken);
    const expiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = new Date(Date.now() + this.parseDuration(expiresIn));

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return { accessToken, refreshToken, expiresIn: this.config.get('JWT_EXPIRES_IN', '15m') };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 604800000;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return value * (multipliers[unit] ?? 86400000);
  }
}
