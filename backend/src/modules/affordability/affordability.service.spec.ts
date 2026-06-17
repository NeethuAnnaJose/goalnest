import { Test, TestingModule } from '@nestjs/testing';
import { AffordabilityService } from './affordability.service';
import { PrismaService } from '../../prisma/prisma.service';
import { IncomeService } from '../income/income.service';
import { ExpensesService } from '../expenses/expenses.service';
import { SavingsService } from '../savings/savings.service';
import { GoalsService } from '../goals/goals.service';

describe('AffordabilityService', () => {
  let service: AffordabilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AffordabilityService,
        { provide: PrismaService, useValue: { user: { findUnique: jest.fn().mockResolvedValue({ currency: 'INR', monthlySalary: 10000000n }) }, loan: { findMany: jest.fn().mockResolvedValue([]) } } },
        { provide: IncomeService, useValue: { findAll: jest.fn().mockResolvedValue([{ amount: 10000000n }]) } },
        { provide: ExpensesService, useValue: { findAll: jest.fn().mockResolvedValue([{ amount: 5000000n }]) } },
        { provide: SavingsService, useValue: { findAll: jest.fn().mockResolvedValue([{ balance: 20000000n }]) } },
        { provide: GoalsService, useValue: { findAll: jest.fn().mockResolvedValue([]) } },
      ],
    }).compile();
    service = module.get(AffordabilityService);
  });

  it('returns affordability verdict', async () => {
    const result = await service.analyze('u1', {
      productName: 'Phone',
      productCost: '10000',
    });
    expect(result.verdict).toBeDefined();
    expect(result.productName).toBe('Phone');
  });
});
