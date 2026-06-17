import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ExpensesService } from '../expenses/expenses.service';
import { OpenAiService } from './openai.service';
import { FinancialContextService } from './financial-context.service';
import { GeneratedInsightItem } from './dto/ai-insight.dto';
import {
  SYSTEM_PROMPT,
  DAILY_PROMPT,
  WEEKLY_PROMPT,
  MONTHLY_PROMPT,
  OVERSPENDING_PROMPT,
  GOAL_RECOMMENDATIONS_PROMPT,
} from './ai-coach.prompts';

@Injectable()
export class AiCoachService {
  private readonly logger = new Logger(AiCoachService.name);

  constructor(
    private prisma: PrismaService,
    private expensesService: ExpensesService,
    private openAi: OpenAiService,
    private contextService: FinancialContextService,
  ) {}

  async generateDailyInsights(userId: string) {
    return this.generateAndStore(userId, 'daily', DAILY_PROMPT, () =>
      this.buildFallbackDaily(userId),
    );
  }

  async generateWeeklyReport(userId: string) {
    return this.generateAndStore(userId, 'weekly', WEEKLY_PROMPT, () =>
      this.buildFallbackWeekly(userId),
    );
  }

  async generateMonthlyReport(userId: string) {
    return this.generateAndStore(userId, 'monthly', MONTHLY_PROMPT, () =>
      this.buildFallbackMonthly(userId),
    );
  }

  async detectOverspending(userId: string) {
    return this.generateAndStore(userId, 'daily', OVERSPENDING_PROMPT, () =>
      this.buildFallbackOverspending(userId),
    );
  }

  async generateGoalRecommendations(userId: string) {
    return this.generateAndStore(userId, 'daily', GOAL_RECOMMENDATIONS_PROMPT, () =>
      this.buildFallbackGoals(userId),
    );
  }

  private async generateAndStore(
    userId: string,
    period: string,
    prompt: string,
    fallback: () => Promise<GeneratedInsightItem[]>,
  ) {
    const context = await this.contextService.buildContext(
      userId,
      period as 'daily' | 'weekly' | 'monthly',
    );

    let insights: GeneratedInsightItem[];
    let source = 'openai';
    let summary: string | undefined;

    if (this.openAi.isConfigured()) {
      try {
        const response = await this.openAi.generateInsights(SYSTEM_PROMPT, prompt, context);
        insights = response.insights;
        summary = response.summary;
      } catch (error) {
        this.logger.error(`OpenAI generation failed: ${error}`);
        insights = await fallback();
        source = 'fallback';
      }
    } else {
      insights = await fallback();
      source = 'fallback';
    }

    const saved = [];
    for (const insight of insights) {
      const record = await this.prisma.aiInsight.create({
        data: {
          userId,
          period,
          title: insight.title,
          content: insight.content,
          category: insight.category,
          severity: insight.severity,
          metadata: {
            source,
            summary,
            generatedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });
      saved.push(record);
    }

    return { insights: saved, count: saved.length, source, summary };
  }

  async getInsights(userId: string, period?: string, category?: string) {
    return this.prisma.aiInsight.findMany({
      where: {
        userId,
        ...(period ? { period } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markInsightRead(userId: string, insightId: string) {
    return this.prisma.aiInsight.updateMany({
      where: { id: insightId, userId },
      data: { isRead: true },
    });
  }

  // ── Rule-based fallbacks when OpenAI unavailable ──────────

  private async buildFallbackDaily(userId: string): Promise<GeneratedInsightItem[]> {
    const insights: GeneratedInsightItem[] = [];
    const context = await this.contextService.buildContext(userId, 'daily');

    insights.push({
      title: 'Today at a glance',
      content: `Your savings rate is ${context.savingsRate.toFixed(1)}%. Income: ${context.user.currency} ${context.income.total}, Expenses: ${context.user.currency} ${context.expenses.total}. Safe to spend: ${context.user.currency} ${context.safeToSpend ?? '0'}.`,
      category: 'insight',
      severity: context.savingsRate >= 20 ? 'success' : 'info',
    });

    for (const alert of context.overspendingAlerts) {
      insights.push({
        title: 'Spending Alert',
        content: alert.message,
        category: 'overspending',
        severity: alert.increasePercent >= 40 ? 'warning' : 'info',
      });
    }

    return insights;
  }

  private async buildFallbackWeekly(userId: string): Promise<GeneratedInsightItem[]> {
    const context = await this.contextService.buildContext(userId, 'weekly');
    return [{
      title: 'Weekly summary',
      content: `This week: ${context.expenses.transactionCount} expenses totaling ${context.user.currency} ${context.expenses.total}. Savings rate: ${context.savingsRate.toFixed(1)}%. Review your top categories and adjust your budget for next week.`,
      category: 'report',
      severity: 'info',
    }];
  }

  private async buildFallbackMonthly(userId: string): Promise<GeneratedInsightItem[]> {
    const context = await this.contextService.buildContext(userId, 'monthly');
    const items: GeneratedInsightItem[] = [{
      title: 'Monthly summary',
      content: `Monthly summary: Earned ${context.user.currency} ${context.income.total}, spent ${context.user.currency} ${context.expenses.total}. Savings rate: ${context.savingsRate.toFixed(1)}%. Total savings balance: ${context.user.currency} ${context.savings.totalBalance}.`,
      category: 'report',
      severity: context.savingsRate >= 20 ? 'success' : 'info',
    }];

    if (context.overspendingAlerts.length > 0) {
      items.push({
        title: 'Overspending Detected',
        content: context.overspendingAlerts[0].message,
        category: 'overspending',
        severity: 'warning',
      });
    }

    return items;
  }

  private async buildFallbackOverspending(userId: string): Promise<GeneratedInsightItem[]> {
    const alerts = await this.expensesService.detectOverspending(userId);
    if (alerts.length === 0) {
      return [{
        title: 'Spending is on track',
        content: 'Nothing unusual compared to last month. Keep logging expenses so the numbers stay accurate.',
        category: 'overspending',
        severity: 'success',
      }];
    }
    return alerts.map((alert) => ({
      title: `${alert.category} Overspending`,
      content: `${alert.message} Consider setting a category budget or reviewing recent transactions in this area.`,
      category: 'overspending',
      severity: alert.increasePercent >= 40 ? 'critical' : 'warning',
    }));
  }

  private async buildFallbackGoals(userId: string): Promise<GeneratedInsightItem[]> {
    const context = await this.contextService.buildContext(userId, 'monthly');
    if (context.goals.length === 0) {
      return [{
        title: 'Set a savings goal',
        content: `You have ${context.user.currency} ${context.savings.totalBalance} saved. A good first step is an emergency fund covering 3 to 6 months of expenses.`,
        category: 'goals',
        severity: 'info',
      }];
    }

    return context.goals.slice(0, 5).map((goal) => {
      const severity = goal.completionPercent >= 75
        ? 'success'
        : goal.completionPercent >= 25
          ? 'info'
          : 'warning';
      let content = `You're ${goal.completionPercent.toFixed(0)}% toward "${goal.name}" (${goal.currentSavings} of ${goal.targetAmount}).`;
      if (goal.requiredMonthlySaving) {
        content += ` Save ${goal.requiredMonthlySaving}/month to stay on track.`;
      }
      return {
        title: `Goal: ${goal.name}`,
        content,
        category: 'goals',
        severity,
      };
    });
  }
}
