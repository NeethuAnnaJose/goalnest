import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmisService } from './emis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmiPaymentStatus } from '@prisma/client';

describe('EmisService', () => {
  let service: EmisService;
  const prisma = {
    emiPayment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    loan: { findFirst: jest.fn(), update: jest.fn() },
    $transaction: jest.fn((ops) => Promise.all(ops)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmisService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(EmisService);
    jest.clearAllMocks();
  });

  it('returns EMI tracker stats', async () => {
    prisma.loan.findFirst.mockResolvedValue({
      id: 'l1',
      name: 'Home Loan',
      emis: [
        { status: EmiPaymentStatus.PAID },
        { status: EmiPaymentStatus.PENDING },
        { status: EmiPaymentStatus.MISSED },
      ],
    });
    const result = await service.getTracker('u1', 'l1');
    expect(result.paid).toBe(1);
    expect(result.missed).toBe(1);
    expect(result.pending).toBe(1);
  });

  it('throws NotFoundException for missing EMI', async () => {
    prisma.emiPayment.findFirst.mockResolvedValue(null);
    await expect(service.findOne('u1', 'x')).rejects.toThrow(NotFoundException);
  });
});
