import { Test, TestingModule } from '@nestjs/testing';
import { HousePlannerService } from './house-planner.service';
import { PrismaService } from '../../prisma/prisma.service';
import { IncomeService } from '../income/income.service';
import { SavingsService } from '../savings/savings.service';

describe('HousePlannerService', () => {
  let service: HousePlannerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HousePlannerService,
        { provide: PrismaService, useValue: { user: { findUnique: jest.fn().mockResolvedValue({ currency: 'INR', monthlySalary: 10000000n }) } } },
        { provide: IncomeService, useValue: { findAll: jest.fn().mockResolvedValue([]) } },
        { provide: SavingsService, useValue: { findAll: jest.fn().mockResolvedValue([{ balance: 50000000n }]) } },
      ],
    }).compile();
    service = module.get(HousePlannerService);
  });

  it('returns house planning results', async () => {
    const result = await service.plan('u1', {
      propertyPrice: '5000000',
      downPaymentPercent: '20',
      interestRate: '8.5',
      monthlyPayment: '35000',
    });
    expect(result.monthlyEmi).toBeGreaterThan(0n);
    expect(result.requiredDownPayment).toBeGreaterThan(0n);
    expect(result.formatted).toBeDefined();
  });
});
