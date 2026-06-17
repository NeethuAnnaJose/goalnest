import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IncomeService } from '../income/income.service';
import { ExpensesService } from '../expenses/expenses.service';
import { SavingsService } from '../savings/savings.service';
import { GoalsService } from '../goals/goals.service';
import { AffordabilityDto } from './dto/affordability.dto';
import { analyzeAffordability } from '../../common/utils/emi.util';
import { toMinorUnits, fromMinorUnits, MoneyMinor } from '../../common/utils/money.util';

@Injectable()
export class AffordabilityService {
  constructor(
    private prisma: PrismaService,
    private incomeService: IncomeService,
    private expensesService: ExpensesService,
    private savingsService: SavingsService,
    private goalsService: GoalsService,
  ) {}

  private monthKey(offsetMonths: number): string {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - offsetMonths);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  private async averageMonthlyTotal(
    userId: string,
    kind: 'income' | 'expense',
    fallback: MoneyMinor,
  ): Promise<MoneyMinor> {
    const totals: MoneyMinor[] = [];

    for (let i = 0; i < 3; i++) {
      const month = this.monthKey(i);
      const records =
        kind === 'income'
          ? await this.incomeService.findAll(userId, month)
          : await this.expensesService.findAll(userId, { month });
      const sum = records.reduce((s, r) => s + r.amount, 0n);
      if (sum > 0n) totals.push(sum);
    }

    if (totals.length === 0) return fallback;
    return totals.reduce((s, v) => s + v, 0n) / BigInt(totals.length);
  }

  async analyze(userId: string, dto: AffordabilityDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currency = user?.currency ?? 'INR';
    const salaryFallback = user?.monthlySalary ?? 0n;

    const [monthlyIncome, monthlyExpenses, loans, savingsAccounts, goals] = await Promise.all([
      this.averageMonthlyTotal(userId, 'income', salaryFallback),
      this.averageMonthlyTotal(userId, 'expense', 0n),
      this.prisma.loan.findMany({ where: { userId, deletedAt: null } }),
      this.savingsService.findAll(userId),
      this.goalsService.findAll(userId),
    ]);

    const productCost = toMinorUnits(dto.productCost, currency);
    const currentSavings = savingsAccounts.reduce((s, a) => s + a.balance, 0n);
    const totalEmi = loans.reduce((s, l) => s + l.emiAmount, 0n);

    const result = analyzeAffordability({
      productCost,
      currentSavings,
      monthlyIncome,
      monthlyExpenses,
      totalEmiObligations: totalEmi,
      currency,
    });

    const goalImpacts = goals
      .filter((g) => !g.isCompleted)
      .map((g) => {
        const delayMonths =
          result.verdict === 'NOT_RECOMMENDED' && result.monthsUntilRecommended
            ? result.monthsUntilRecommended
            : 0;
        return {
          goalName: g.name,
          currentProgress: g.completionPercent,
          estimatedDelayMonths: delayMonths,
        };
      });

    return {
      productName: dto.productName,
      productCost,
      productCostMajor: fromMinorUnits(productCost, currency),
      ...result,
      safeToSpendMajor: fromMinorUnits(result.safeToSpend, currency),
      currentSavingsMajor: fromMinorUnits(currentSavings, currency),
      monthlyIncomeMajor: fromMinorUnits(monthlyIncome, currency),
      monthlyExpensesMajor: fromMinorUnits(monthlyExpenses, currency),
      goalImpacts,
    };
  }
}
