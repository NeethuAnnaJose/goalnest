import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExpensesService } from '../expenses/expenses.service';
import { GoalsService } from '../goals/goals.service';
import { fromMinorUnits } from '../../common/utils/money.util';

export interface FinancialContext {
  user: { name?: string; currency: string; monthlySalary?: string };
  period: { type: string; startDate: string; endDate: string };
  income: { total: string; transactionCount: number };
  expenses: { total: string; transactionCount: number; byCategory: Record<string, string> };
  savings: { totalBalance: string; accountCount: number };
  loans: { count: number; totalEmi: string; outstandingBalance: string };
  goals: Array<{
    name: string;
    type: string;
    targetAmount: string;
    currentSavings: string;
    completionPercent: number;
    requiredMonthlySaving?: string;
    targetDate?: string;
  }>;
  overspendingAlerts: Array<{ category: string; increasePercent: number; message: string }>;
  savingsRate: number;
  safeToSpend?: string;
}

@Injectable()
export class FinancialContextService {
  constructor(
    private prisma: PrismaService,
    private expensesService: ExpensesService,
    private goalsService: GoalsService,
  ) {}

  async buildContext(
    userId: string,
    periodType: 'daily' | 'weekly' | 'monthly',
  ): Promise<FinancialContext> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currency = user?.currency ?? 'INR';
    const { startDate, endDate } = this.getPeriodRange(periodType);
    const month = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

    const [incomes, expenses, savings, loans, goals, overspending] = await Promise.all([
      this.prisma.income.findMany({
        where: { userId, deletedAt: null, date: { gte: startDate, lte: endDate } },
      }),
      this.prisma.expense.findMany({
        where: { userId, deletedAt: null, date: { gte: startDate, lte: endDate } },
      }),
      this.prisma.savingsAccount.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.loan.findMany({ where: { userId, deletedAt: null } }),
      this.goalsService.findAll(userId),
      this.expensesService.detectOverspending(userId),
    ]);

    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0n);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0n);
    const totalSavings = savings.reduce((s, a) => s + a.balance, 0n);
    const totalEmi = loans.reduce((s, l) => s + l.emiAmount, 0n);
    const outstandingLoans = loans.reduce((s, l) => s + l.remainingBalance, 0n);

    const byCategory: Record<string, bigint> = {};
    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] ?? 0n) + e.amount;
    }

    const monthlyIncome = user?.monthlySalary ?? totalIncome;
    const safeToSpend = monthlyIncome - totalExpenses - totalEmi;
    const savingsRate =
      totalIncome > 0n ? Number(((totalIncome - totalExpenses) * 100n) / totalIncome) : 0;

    return {
      user: {
        name: user?.name ?? undefined,
        currency,
        monthlySalary: user?.monthlySalary
          ? fromMinorUnits(user.monthlySalary, currency)
          : undefined,
      },
      period: {
        type: periodType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      income: {
        total: fromMinorUnits(totalIncome, currency),
        transactionCount: incomes.length,
      },
      expenses: {
        total: fromMinorUnits(totalExpenses, currency),
        transactionCount: expenses.length,
        byCategory: Object.fromEntries(
          Object.entries(byCategory).map(([k, v]) => [k, fromMinorUnits(v, currency)]),
        ),
      },
      savings: {
        totalBalance: fromMinorUnits(totalSavings, currency),
        accountCount: savings.length,
      },
      loans: {
        count: loans.length,
        totalEmi: fromMinorUnits(totalEmi, currency),
        outstandingBalance: fromMinorUnits(outstandingLoans, currency),
      },
      goals: goals.map((g) => ({
        name: g.name,
        type: g.type,
        targetAmount: g.targetAmountMajor ?? fromMinorUnits(g.targetAmount, currency),
        currentSavings: g.currentSavingsMajor ?? fromMinorUnits(g.currentSavings, currency),
        completionPercent: g.completionPercent ?? 0,
        requiredMonthlySaving: g.requiredMonthlySaving
          ? fromMinorUnits(g.requiredMonthlySaving, currency)
          : undefined,
        targetDate: g.targetDate?.toISOString(),
      })),
      overspendingAlerts: overspending,
      savingsRate,
      safeToSpend: fromMinorUnits(safeToSpend > 0n ? safeToSpend : 0n, currency),
    };
  }

  private getPeriodRange(periodType: 'daily' | 'weekly' | 'monthly') {
    const endDate = new Date();
    const startDate = new Date();
    switch (periodType) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }
    return { startDate, endDate };
  }
}
