import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
jest.mock('./mfa.service', () => ({
  MfaService: jest.fn().mockImplementation(() => ({
    verifyCode: jest.fn().mockResolvedValue(true),
  })),
}));

import { AuthService } from './auth.service';
import { MfaService } from './mfa.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    device: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  const jwt = { sign: jest.fn().mockReturnValue('access-token') };
  const config = {
    get: jest.fn((key: string, def?: string) => {
      const map: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return map[key] ?? def;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
        { provide: MfaService, useValue: { verifyCode: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('throws ConflictException if email exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'a@b.com' });
      await expect(
        service.register({ email: 'a@b.com', password: 'password123' }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates user and returns tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      prisma.user.create.mockResolvedValue({ id: 'u1', email: 'a@b.com', role: 'USER' });
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.register({ email: 'a@b.com', password: 'password123' });
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException for invalid credentials', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(
        service.login({ email: 'a@b.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns mfaRequired when MFA enabled', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        passwordHash: 'hash',
        mfaEnabled: true,
        role: 'USER',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'a@b.com', password: 'password123' });
      expect(result).toEqual({ mfaRequired: true, tempToken: 'access-token' });
    });
  });
});
