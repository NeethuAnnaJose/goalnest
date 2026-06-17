import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IncomeService } from '../income/income.service';
import { ExpensesService } from '../expenses/expenses.service';
import { GoalsService } from '../goals/goals.service';
import { SavingsService } from '../savings/savings.service';
import {
  calculateEmergencyFundTarget,
  calculateFinancialHealthScore,
} from '../../common/utils/emi.util';

@Injectable()
export class HealthScoreService {
  constructor(
    private prisma: PrismaService,
    private incomeService: IncomeService,
    private expensesService: ExpensesService,
    private goalsService: GoalsService,
    private savingsService: SavingsService,
  ) {}

  async calculate(userId: string) {
    const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const [incomes, expenses, loans, goals, savingsAccounts, overspending] =
      await Promise.all([
        this.incomeService.findAll(userId, month),
        this.expensesService.findAll(userId, { month }),
        this.prisma.loan.findMany({ where: { userId, deletedAt: null } }),
        this.goalsService.findAll(userId),
        this.savingsService.findAll(userId),
        this.expensesService.detectOverspending(userId),
      ]);

    const monthlyIncome = incomes.reduce((s, i) => s + i.amount, 0n);
    const monthlyExpenses = expenses.reduce((s, e) => s + e.amount, 0n);
    const totalEmi = loans.reduce((s, l) => s + l.emiAmount, 0n);
    const totalSavings = savingsAccounts.reduce((s, a) => s + a.balance, 0n);

    const savingsRate =
      monthlyIncome > 0n
        ? Number(((monthlyIncome - monthlyExpenses) * 100n) / monthlyIncome)
        : 0;
    const debtToIncomeRatio =
      monthlyIncome > 0n ? Number(totalEmi) / Number(monthlyIncome) : 0;
    const avgExpenses = monthlyExpenses || 1n;
    const emergencyTarget = calculateEmergencyFundTarget(avgExpenses);
    const emergencyFundRatio = Number(totalSavings) / Number(avgExpenses);
    const goalProgressAvg =
      goals.length > 0
        ? goals.reduce((s, g) => s + (g.completionPercent ?? 0), 0) / goals.length
        : 0;
    const spendingStability = Math.max(0, 100 - overspending.length * 15);

    const healthScore = calculateFinancialHealthScore({
      savingsRate,
      debtToIncomeRatio,
      emergencyFundRatio,
      goalProgressAvg,
      spendingStability,
    });

    return {
      ...healthScore,
      factors: {
        savingsRate: { value: savingsRate, weight: '25%', status: savingsRate >= 20 ? 'good' : 'needs_improvement' },
        debtToIncomeRatio: { value: debtToIncomeRatio, weight: '25%', status: debtToIncomeRatio <= 0.4 ? 'good' : 'needs_improvement' },
        emergencyFund: { monthsCovered: emergencyFundRatio, target: 6, weight: '20%' },
        goalProgress: { average: goalProgressAvg, weight: '15%' },
        spendingStability: { score: spendingStability, weight: '15%' },
      },
    };
  }
}
