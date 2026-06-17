import { Test, TestingModule } from '@nestjs/testing';
import { HealthScoreService } from './health-score.service';
import { PrismaService } from '../../prisma/prisma.service';
import { IncomeService } from '../income/income.service';
import { ExpensesService } from '../expenses/expenses.service';
import { GoalsService } from '../goals/goals.service';
import { SavingsService } from '../savings/savings.service';

describe('HealthScoreService', () => {
  let service: HealthScoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthScoreService,
        { provide: PrismaService, useValue: { loan: { findMany: jest.fn().mockResolvedValue([]) } } },
        { provide: IncomeService, useValue: { findAll: jest.fn().mockResolvedValue([{ amount: 10000000n }]) } },
        { provide: ExpensesService, useValue: { findAll: jest.fn().mockResolvedValue([{ amount: 6000000n }]), detectOverspending: jest.fn().mockResolvedValue([]) } },
        { provide: GoalsService, useValue: { findAll: jest.fn().mockResolvedValue([{ completionPercent: 50, isCompleted: false }]) } },
        { provide: SavingsService, useValue: { findAll: jest.fn().mockResolvedValue([{ balance: 30000000n }]) } },
      ],
    }).compile();
    service = module.get(HealthScoreService);
  });

  it('returns score between 0 and 100', async () => {
    const result = await service.calculate('u1');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.grade).toBeDefined();
    expect(result.factors).toBeDefined();
  });
});
