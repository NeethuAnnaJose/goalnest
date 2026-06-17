import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SavingsType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSavingsDto,
  UpdateSavingsDto,
  SavingsDepositDto,
  SavingsContributionDto,
} from './dto/savings.dto';
import { toMinorUnits, fromMinorUnits, addMoney, subtractMoney } from '../../common/utils/money.util';
import {
  effectiveMonthInFY,
  getCurrentFinancialYear,
  monthsInFinancialYear,
  parseFinancialYear,
} from '../../common/utils/financial-year.util';

@Injectable()
export class SavingsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateSavingsDto) {
    if (dto.type === SavingsType.OTHER && !dto.name?.trim()) {
      throw new BadRequestException('Please enter a name for this savings type');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currency = user?.currency ?? 'INR';
    return this.prisma.savingsAccount.create({
      data: {
        userId,
        type: dto.type,
        name: dto.name.trim(),
        balance: toMinorUnits(dto.balance, currency),
        currency,
        interestRate: dto.interestRate,
        institution: dto.institution,
        accountNumber: dto.accountNumber,
        maturityDate: dto.maturityDate ? new Date(dto.maturityDate) : null,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.savingsAccount.findMany({
      where: { userId, deletedAt: null },
      orderBy: { balance: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const account = await this.prisma.savingsAccount.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!account) throw new NotFoundException('Savings account not found');
    return account;
  }

  async update(userId: string, id: string, dto: UpdateSavingsDto) {
    await this.findOne(userId, id);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currency = user?.currency ?? 'INR';
    const data: Record<string, unknown> = { ...dto };
    if (dto.balance) data.balance = toMinorUnits(dto.balance, currency);
    if (dto.maturityDate) data.maturityDate = new Date(dto.maturityDate);
    if (dto.monthlyDebitAmount !== undefined) {
      data.monthlyDebitAmount = dto.monthlyDebitAmount
        ? toMinorUnits(dto.monthlyDebitAmount, currency)
        : null;
    }
    if (dto.debitDayOfMonth !== undefined) {
      data.debitDayOfMonth = dto.debitDayOfMonth ?? null;
    }
    return this.prisma.savingsAccount.update({ where: { id }, data });
  }

  async deposit(userId: string, id: string, dto: SavingsDepositDto) {
    const account = await this.findOne(userId, id);
    const amount = toMinorUnits(dto.amount, account.currency);
    return this.prisma.savingsAccount.update({
      where: { id },
      data: { balance: addMoney(account.balance, amount) },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.savingsAccount.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async listContributions(userId: string, fy?: string, accountId?: string) {
    const financialYear = fy ?? getCurrentFinancialYear().label;
    const fyMonths = monthsInFinancialYear(financialYear);

    return this.prisma.savingsContribution.findMany({
      where: {
        userId,
        month: { in: fyMonths },
        ...(accountId ? { savingsAccountId: accountId } : {}),
      },
      orderBy: { month: 'asc' },
    });
  }

  async recordContribution(userId: string, accountId: string, dto: SavingsContributionDto) {
    const account = await this.findOne(userId, accountId);

    const amountSource = dto.amount ?? (account.monthlyDebitAmount != null
      ? fromMinorUnits(account.monthlyDebitAmount, account.currency)
      : null);
    if (!amountSource || Number(amountSource) <= 0) {
      throw new BadRequestException('Set a monthly debit amount on this account first');
    }

    const amount = toMinorUnits(amountSource, account.currency);

    const existing = await this.prisma.savingsContribution.findUnique({
      where: { savingsAccountId_month: { savingsAccountId: accountId, month: dto.month } },
    });
    if (existing) return existing;

    return this.prisma.$transaction(async (tx) => {
      const contribution = await tx.savingsContribution.create({
        data: {
          savingsAccountId: accountId,
          userId,
          month: dto.month,
          amount,
          currency: account.currency,
        },
      });
      await tx.savingsAccount.update({
        where: { id: accountId },
        data: { balance: addMoney(account.balance, amount) },
      });
      return contribution;
    });
  }

  async removeContribution(userId: string, accountId: string, month: string) {
    const account = await this.findOne(userId, accountId);

    const contribution = await this.prisma.savingsContribution.findUnique({
      where: { savingsAccountId_month: { savingsAccountId: accountId, month } },
    });
    if (!contribution) throw new NotFoundException('Contribution not found for this month');

    const newBalance = subtractMoney(account.balance, contribution.amount);
    if (newBalance < 0n) {
      throw new BadRequestException('Cannot undo: account balance would go negative');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.savingsContribution.delete({ where: { id: contribution.id } });
      return tx.savingsAccount.update({
        where: { id: accountId },
        data: { balance: newBalance },
      });
    });
  }

  async getGrowthStats(userId: string, fy?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currency = user?.currency ?? 'INR';
    const accounts = await this.findAll(userId);
    const totalBalance = accounts.reduce((s, a) => s + a.balance, 0n);

    const now = new Date();
    const financialYear = fy ?? getCurrentFinancialYear(now).label;
    const fyRange = parseFinancialYear(financialYear);
    const activeMonth = effectiveMonthInFY(financialYear, now);
    const [year, m] = activeMonth.split('-').map(Number);
    const monthStart = new Date(year, m - 1, 1);
    const yearStart = fyRange.startDate;
    const yearEnd = fyRange.endDate;

    const monthlyIncome = await this.prisma.income.aggregate({
      where: { userId, deletedAt: null, date: { gte: monthStart } },
      _sum: { amount: true },
    });
    const yearlyIncome = await this.prisma.income.aggregate({
      where: { userId, deletedAt: null, date: { gte: yearStart, lte: yearEnd } },
      _sum: { amount: true },
    });

    const monthlyExpenses = await this.prisma.expense.aggregate({
      where: { userId, deletedAt: null, date: { gte: monthStart } },
      _sum: { amount: true },
    });
    const yearlyExpenses = await this.prisma.expense.aggregate({
      where: { userId, deletedAt: null, date: { gte: yearStart, lte: yearEnd } },
      _sum: { amount: true },
    });

    const monthlyIncomeTotal = monthlyIncome._sum.amount ?? 0n;
    const monthlyExpensesTotal = monthlyExpenses._sum.amount ?? 0n;
    const yearlyIncomeTotal = yearlyIncome._sum.amount ?? 0n;
    const yearlyExpensesTotal = yearlyExpenses._sum.amount ?? 0n;

    const monthlyNetSavings = monthlyIncomeTotal - monthlyExpensesTotal;
    const yearlyNetSavings = yearlyIncomeTotal - yearlyExpensesTotal;

    const fyMonths = monthsInFinancialYear(financialYear);
    const contributions = await this.prisma.savingsContribution.findMany({
      where: { userId, month: { in: fyMonths } },
    });
    const monthlyContributions = contributions
      .filter((c) => c.month === activeMonth)
      .reduce((s, c) => s + c.amount, 0n);
    const yearlyContributions = contributions.reduce((s, c) => s + c.amount, 0n);
    const savedMonthsCount = new Set(contributions.map((c) => c.month)).size;

    return {
      financialYear,
      totalBalance,
      accountCount: accounts.length,
      monthlyIncome: monthlyIncomeTotal,
      monthlyExpenses: monthlyExpensesTotal,
      monthlyNetSavings,
      yearlyIncome: yearlyIncomeTotal,
      yearlyExpenses: yearlyExpensesTotal,
      yearlyNetSavings,
      monthlyContributions,
      yearlyContributions,
      savedMonthsCount,
      // Legacy fields kept for older clients
      monthlySavingsGrowth: monthlyContributions,
      yearlySavingsGrowth: yearlyContributions,
      formatted: {
        totalBalance: fromMinorUnits(totalBalance, currency),
        monthlyIncome: fromMinorUnits(monthlyIncomeTotal, currency),
        monthlyExpenses: fromMinorUnits(monthlyExpensesTotal, currency),
        monthlyNetSavings: fromMinorUnits(monthlyNetSavings, currency),
        yearlyIncome: fromMinorUnits(yearlyIncomeTotal, currency),
        yearlyExpenses: fromMinorUnits(yearlyExpensesTotal, currency),
        yearlyNetSavings: fromMinorUnits(yearlyNetSavings, currency),
        monthlyContributions: fromMinorUnits(monthlyContributions, currency),
        yearlyContributions: fromMinorUnits(yearlyContributions, currency),
        monthlySavingsGrowth: fromMinorUnits(monthlyContributions, currency),
        yearlySavingsGrowth: fromMinorUnits(yearlyContributions, currency),
      },
      byType: accounts.reduce(
        (acc, a) => {
          acc[a.type] = (acc[a.type] ?? 0n) + a.balance;
          return acc;
        },
        {} as Record<string, bigint>,
      ),
    };
  }
}
