import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportPeriod, ReportFormat } from '@prisma/client';

describe('ReportsService', () => {
  let service: ReportsService;
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue({ currency: 'INR' }) },
    income: { findMany: jest.fn().mockResolvedValue([{ amount: 10000000n }]) },
    expense: { findMany: jest.fn().mockResolvedValue([{ amount: 5000000n, category: 'FOOD' }]) },
    loan: { findMany: jest.fn().mockResolvedValue([]) },
    goal: { findMany: jest.fn().mockResolvedValue([]) },
    savingsAccount: { findMany: jest.fn().mockResolvedValue([{ balance: 20000000n }]) },
    report: {
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'r1', ...args.data })),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ReportsService);
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({ currency: 'INR' });
  });

  it('generates monthly report with metadata', async () => {
    const result = await service.generate('u1', {
      period: ReportPeriod.MONTHLY,
      format: ReportFormat.PDF,
    });
    expect(result.id).toBe('r1');
    expect(result.metadata).toBeDefined();
    expect(result.fileUrl).toContain('.pdf');
  });

  it('exports CSV content', async () => {
    prisma.report.findFirst.mockResolvedValue({
      id: 'r1',
      metadata: { summary: { totalIncome: '100000', totalExpenses: '50000', netSavings: '50000' } },
    });
    const csv = await service.exportCsv('u1', 'r1');
    expect(csv).toContain('Total Income');
  });
});
