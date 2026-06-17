import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IncomeService } from '../income/income.service';
import { ExpensesService } from '../expenses/expenses.service';
import { LoansService } from '../loans/loans.service';
import { GoalsService } from '../goals/goals.service';
import {
  calculateEmergencyFundTarget,
  calculateFinancialHealthScore,
  analyzeAffordability,
  calculateHousePlanner,
  projectWealth,
} from '../../common/utils/emi.util';
import { fromMinorUnits, toMinorUnits } from '../../common/utils/money.util';
import {
  effectiveMonthInFY,
  formatFinancialYearLabel,
  getCurrentFinancialYear,
  parseFinancialYear,
  previousMonthKey,
} from '../../common/utils/financial-year.util';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private incomeService: IncomeService,
    private expensesService: ExpensesService,
    private loansService: LoansService,
    private goalsService: GoalsService,
  ) {}

  async getDashboard(userId: string, fy?: string) {
    const now = new Date();
    const financialYear = fy ?? getCurrentFinancialYear(now).label;
    const fyRange = parseFinancialYear(financialYear);
    const month = effectiveMonthInFY(financialYear, now);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currency = user?.currency ?? 'INR';

    const [monthIncomes, monthExpenses, fyIncomeRecords, fyExpenseRecords, loans, goals, savings, upcomingEmis, subscriptions] =
      await Promise.all([
        this.incomeService.findAll(userId, month),
        this.expensesService.findAll(userId, { month }),
        this.incomeService.findAll(userId, undefined, financialYear),
        this.expensesService.findAll(userId, { fy: financialYear }),
        this.prisma.loan.findMany({ where: { userId, deletedAt: null } }),
        this.goalsService.findAll(userId),
        this.prisma.savingsAccount.findMany({ where: { userId, deletedAt: null } }),
        this.loansService.getUpcomingEmis(userId, 30),
        this.prisma.subscription.findMany({
          where: { userId, isActive: true, deletedAt: null },
          orderBy: { renewalDate: 'asc' },
          take: 5,
        }),
      ]);

    const monthlyIncome = monthIncomes.reduce((s, i) => s + i.amount, 0n);
    const monthlyExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0n);
    const fyIncome = fyIncomeRecords.reduce((s, i) => s + i.amount, 0n);
    const fyExpenses = fyExpenseRecords.reduce((s, e) => s + e.amount, 0n);
    const totalSavings = savings.reduce((s, a) => s + a.balance, 0n);
    const outstandingLoans = loans.reduce((s, l) => s + l.remainingBalance, 0n);
    const totalEmi = loans.reduce((s, l) => s + l.emiAmount, 0n);

    const safeToSpend = monthlyIncome - monthlyExpenses - totalEmi;
    const avgMonthlyExpenses = monthlyExpenses || 1n;
    const emergencyTarget = calculateEmergencyFundTarget(avgMonthlyExpenses);
    const emergencyFund = goals.find((g) => g.type === 'EMERGENCY_FUND');
    const emergencyCurrent = emergencyFund?.currentSavings ?? totalSavings;

    const savingsRate =
      monthlyIncome > 0n ? Number(((monthlyIncome - monthlyExpenses) * 100n) / monthlyIncome) : 0;
    const debtRatio = monthlyIncome > 0n ? Number(totalEmi) / Number(monthlyIncome) : 0;
    const emergencyRatio = Number(emergencyCurrent) / Number(avgMonthlyExpenses);
    const goalProgress =
      goals.length > 0
        ? goals.reduce((s, g) => s + (g.completionPercent ?? 0), 0) / goals.length
        : 0;

    const healthScore = calculateFinancialHealthScore({
      savingsRate,
      debtToIncomeRatio: debtRatio,
      emergencyFundRatio: emergencyRatio,
      goalProgressAvg: goalProgress,
      spendingStability: 75,
    });

    return {
      financialYear,
      financialYearLabel: formatFinancialYearLabel(financialYear),
      fyStartDate: fyRange.startDate.toISOString(),
      fyEndDate: fyRange.endDate.toISOString(),
      activeMonth: month,
      previousMonth: previousMonthKey(month),
      monthlyIncome,
      monthlyExpenses,
      fyIncome,
      fyExpenses,
      currentSavings: totalSavings,
      outstandingLoans,
      upcomingEmis,
      upcomingBills: subscriptions,
      activeGoals: goals.filter((g) => !g.isCompleted),
      emergencyFund: {
        current: emergencyCurrent,
        target: emergencyTarget,
        progressPercent: Math.min(100, Number((emergencyCurrent * 100n) / emergencyTarget)),
      },
      financialHealthScore: healthScore,
      safeToSpend: safeToSpend > 0n ? safeToSpend : 0n,
      currency,
      formatted: {
        monthlyIncome: fromMinorUnits(monthlyIncome, currency),
        monthlyExpenses: fromMinorUnits(monthlyExpenses, currency),
        fyIncome: fromMinorUnits(fyIncome, currency),
        fyExpenses: fromMinorUnits(fyExpenses, currency),
        currentSavings: fromMinorUnits(totalSavings, currency),
        safeToSpend: fromMinorUnits(safeToSpend > 0n ? safeToSpend : 0n, currency),
      },
    };
  }

  async housePlanner(userId: string, input: {
    propertyPrice: string;
    downPaymentPercent: string;
    interestRate: string;
    monthlyPayment: string;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currency = user?.currency ?? 'INR';
    const savings = await this.prisma.savingsAccount.findMany({
      where: { userId, deletedAt: null },
    });
    const currentSavings = savings.reduce((s, a) => s + a.balance, 0n);
    const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const incomes = await this.incomeService.findAll(userId, month);
    const monthlyIncome = incomes.reduce((s, i) => s + i.amount, 0n) || user?.monthlySalary || 0n;

    return calculateHousePlanner({
      propertyPrice: toMinorUnits(input.propertyPrice, currency),
      downPaymentPercent: input.downPaymentPercent,
      annualInterestRate: input.interestRate,
      monthlyPayment: toMinorUnits(input.monthlyPayment, currency),
      currentSavings,
      monthlyIncome,
      currency,
    });
  }

  async affordabilityCheck(userId: string, productName: string, productCost: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currency = user?.currency ?? 'INR';
    const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const [incomes, expenses, loans, savings] = await Promise.all([
      this.incomeService.findAll(userId, month),
      this.expensesService.findAll(userId, { month }),
      this.prisma.loan.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.savingsAccount.findMany({ where: { userId, deletedAt: null } }),
    ]);

    return {
      productName,
      ...analyzeAffordability({
        productCost: toMinorUnits(productCost, currency),
        currentSavings: savings.reduce((s, a) => s + a.balance, 0n),
        monthlyIncome: incomes.reduce((s, i) => s + i.amount, 0n) || user?.monthlySalary || 0n,
        monthlyExpenses: expenses.reduce((s, e) => s + e.amount, 0n),
        totalEmiObligations: loans.reduce((s, l) => s + l.emiAmount, 0n),
        currency,
      }),
    };
  }

  async wealthSimulator(userId: string, input: {
    monthlySavings: string;
    annualIncrease: string;
    annualReturn: string;
    years: number;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currency = user?.currency ?? 'INR';
    return projectWealth({
      monthlySavings: toMinorUnits(input.monthlySavings, currency),
      annualIncreasePercent: input.annualIncrease,
      annualReturnPercent: input.annualReturn,
      years: input.years,
      currency,
    });
  }

  async emergencyFundStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currency = user?.currency ?? 'INR';
    const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const expenses = await this.expensesService.findAll(userId, { month });
    const avgExpenses = expenses.reduce((s, e) => s + e.amount, 0n) || 1n;
    const target = calculateEmergencyFundTarget(avgExpenses);

    const savings = await this.prisma.savingsAccount.findMany({
      where: { userId, deletedAt: null },
    });
    const current = savings.reduce((s, a) => s + a.balance, 0n);
    const remaining = target - current;
    const monthsRemaining =
      remaining > 0n ? Math.ceil(Number(remaining) / Number(avgExpenses)) : 0;

    return {
      current,
      target,
      progressPercent: Math.min(100, Number((current * 100n) / target)),
      monthsRemaining,
      formatted: {
        current: fromMinorUnits(current, currency),
        target: fromMinorUnits(target, currency),
      },
    };
  }
}
