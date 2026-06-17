import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SavingsService } from './savings.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SavingsService', () => {
  let service: SavingsService;
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue({ currency: 'INR' }) },
    savingsAccount: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
    income: { aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 100000n } }) },
    expense: { aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 50000n } }) },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavingsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(SavingsService);
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({ currency: 'INR' });
  });

  it('creates savings account with minor units', async () => {
    prisma.savingsAccount.create.mockResolvedValue({ id: 's1', balance: 10000000n });
    const result = await service.create('u1', {
      type: 'BANK',
      name: 'HDFC',
      balance: '100000',
    });
    expect(result.balance).toBe(10000000n);
  });

  it('throws NotFoundException for missing account', async () => {
    prisma.savingsAccount.findFirst.mockResolvedValue(null);
    await expect(service.findOne('u1', 'missing')).rejects.toThrow(NotFoundException);
  });
});
