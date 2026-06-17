import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LoansService } from './loans.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('LoansService', () => {
  let service: LoansService;
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue({ currency: 'INR' }) },
    loan: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    emiPayment: { createMany: jest.fn(), findFirst: jest.fn() },
    $transaction: jest.fn((ops) => Promise.all(ops)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoansService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(LoansService);
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({ currency: 'INR' });
  });

  it('creates loan and generates EMI schedule', async () => {
    prisma.loan.create.mockResolvedValue({
      id: 'l1',
      principal: 500000000n,
      interestRate: '8.5',
      tenureMonths: 240,
      emiAmount: 4330000n,
      remainingBalance: 500000000n,
      currency: 'INR',
      startDate: new Date('2026-01-01'),
    });
    prisma.loan.findFirst.mockResolvedValue({
      id: 'l1',
      principal: 500000000n,
      interestRate: '8.5',
      tenureMonths: 240,
      emiAmount: 4330000n,
      remainingBalance: 500000000n,
      currency: 'INR',
      emis: [],
    });
    prisma.emiPayment.createMany.mockResolvedValue({ count: 240 });

    const result = await service.create('u1', {
      type: 'HOME',
      name: 'Home Loan',
      principal: '5000000',
      interestRate: '8.5',
      tenureMonths: 240,
      startDate: '2026-01-01',
    });
    expect(prisma.emiPayment.createMany).toHaveBeenCalled();
    expect(result.remainingMonths).toBeGreaterThan(0);
  });

  it('throws NotFoundException for missing loan', async () => {
    prisma.loan.findFirst.mockResolvedValue(null);
    await expect(service.findOne('u1', 'x')).rejects.toThrow(NotFoundException);
  });
});
