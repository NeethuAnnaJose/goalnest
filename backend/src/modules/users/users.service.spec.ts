import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  const prisma = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    device: { findMany: jest.fn(), updateMany: jest.fn() },
    refreshToken: { updateMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(UsersService);
    jest.clearAllMocks();
  });

  it('returns user profile', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'u1', email: 'a@b.com' });
    const result = await service.getProfile('u1');
    expect(result.email).toBe('a@b.com');
  });

  it('throws NotFoundException for missing user', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(service.getProfile('x')).rejects.toThrow(NotFoundException);
  });

  it('updates profile with salary in minor units', async () => {
    prisma.user.findUnique.mockResolvedValue({ currency: 'INR' });
    prisma.user.update.mockResolvedValue({ id: 'u1', monthlySalary: 10000000n });
    const result = await service.updateProfile('u1', { monthlySalary: '100000' });
    expect(result.monthlySalary).toBe(10000000n);
  });
});
