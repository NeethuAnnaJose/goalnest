import { Test, TestingModule } from '@nestjs/testing';
import { AiCoachService } from './ai-coach.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ExpensesService } from '../expenses/expenses.service';
import { OpenAiService } from './openai.service';
import { FinancialContextService } from './financial-context.service';

const mockContext = {
  user: { currency: 'INR', name: 'Test' },
  period: { type: 'daily', startDate: '2026-06-01', endDate: '2026-06-05' },
  income: { total: '100000', transactionCount: 1 },
  expenses: { total: '50000', transactionCount: 5, byCategory: { FOOD: '20000' } },
  savings: { totalBalance: '200000', accountCount: 1 },
  loans: { count: 0, totalEmi: '0', outstandingBalance: '0' },
  goals: [],
  overspendingAlerts: [],
  savingsRate: 50,
  safeToSpend: '50000',
};

describe('AiCoachService', () => {
  let service: AiCoachService;
  const prisma = {
    goal: { findMany: jest.fn().mockResolvedValue([]) },
    aiInsight: {
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'i1', ...args.data })),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    user: { findUnique: jest.fn().mockResolvedValue({ currency: 'INR', name: 'Test' }) },
    income: { findMany: jest.fn().mockResolvedValue([]) },
    expense: { findMany: jest.fn().mockResolvedValue([]) },
    savingsAccount: { findMany: jest.fn().mockResolvedValue([]) },
    loan: { findMany: jest.fn().mockResolvedValue([]) },
  };

  const openAi = {
    isConfigured: jest.fn().mockReturnValue(false),
    generateInsights: jest.fn(),
  };

  const contextService = {
    buildContext: jest.fn().mockResolvedValue(mockContext),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiCoachService,
        { provide: PrismaService, useValue: prisma },
        { provide: ExpensesService, useValue: { detectOverspending: jest.fn().mockResolvedValue([]) } },
        { provide: OpenAiService, useValue: openAi },
        { provide: FinancialContextService, useValue: contextService },
      ],
    }).compile();
    service = module.get(AiCoachService);
    jest.clearAllMocks();
    openAi.isConfigured.mockReturnValue(false);
    contextService.buildContext.mockResolvedValue(mockContext);
  });

  it('generates daily insights with fallback and stores in ai_insights', async () => {
    const result = await service.generateDailyInsights('u1');
    expect(result.count).toBeGreaterThan(0);
    expect(result.source).toBe('fallback');
    expect(prisma.aiInsight.create).toHaveBeenCalled();
  });

  it('generates monthly report via fallback', async () => {
    const result = await service.generateMonthlyReport('u1');
    expect(result.insights[0].period).toBe('monthly');
    expect(result.source).toBe('fallback');
  });

  it('detects overspending with fallback when no alerts', async () => {
    const result = await service.detectOverspending('u1');
    expect(result.count).toBe(1);
    expect(result.insights[0].category).toBe('overspending');
  });

  it('generates goal recommendations for users without goals', async () => {
    const result = await service.generateGoalRecommendations('u1');
    expect(result.insights[0].category).toBe('goals');
  });

  it('uses OpenAI when configured', async () => {
    openAi.isConfigured.mockReturnValue(true);
    openAi.generateInsights.mockResolvedValue({
      summary: 'AI summary',
      insights: [{ title: 'AI Insight', content: 'From GPT', category: 'insight', severity: 'info' }],
    });
    const result = await service.generateDailyInsights('u1');
    expect(result.source).toBe('openai');
    expect(openAi.generateInsights).toHaveBeenCalled();
  });

  it('falls back when OpenAI fails', async () => {
    openAi.isConfigured.mockReturnValue(true);
    openAi.generateInsights.mockRejectedValue(new Error('API error'));
    const result = await service.generateDailyInsights('u1');
    expect(result.source).toBe('fallback');
    expect(result.count).toBeGreaterThan(0);
  });
});
