import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GenerateReportDto } from './dto/report.dto';
import {
  Expense,
  Goal,
  Income,
  Loan,
  ReportFormat,
  ReportPeriod,
  SavingsAccount,
} from '@prisma/client';
import { fromMinorUnits, MoneyMinor } from '../../common/utils/money.util';
import { buildReportExcel } from './report-excel.export';

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
};

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  buildReportName(
    period: ReportPeriod,
    format: ReportFormat,
    startDate: Date,
    endDate: Date,
  ): string {
    const periodLabel = PERIOD_LABELS[period] ?? period;
    const range = `${startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} to ${endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    return `${periodLabel} Financial Report, ${range} (${format})`;
  }

  private money(amount: MoneyMinor, currency: string): string {
    return fromMinorUnits(amount, currency);
  }

  private mapIncomes(incomes: Income[], currency: string) {
    return incomes
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map((i) => ({
        type: i.type,
        amount: this.money(i.amount, currency),
        date: i.date.toISOString(),
        category: i.category,
        notes: i.notes,
        isRecurring: i.isRecurring,
      }));
  }

  private mapExpensesByCategory(expenses: Expense[], currency: string) {
    const grouped: Record<
      string,
      { total: string; items: { date: string; description: string; merchant: string; amount: string }[] }
    > = {};

    for (const e of expenses) {
      const key = e.category;
      if (!grouped[key]) grouped[key] = { total: '0.00', items: [] };
      grouped[key].items.push({
        date: e.date.toISOString(),
        description: e.description ?? e.category,
        merchant: e.merchant ?? '',
        amount: this.money(e.amount, currency),
      });
    }

    for (const [key, group] of Object.entries(grouped)) {
      const total = expenses
        .filter((e) => e.category === key)
        .reduce((s, e) => s + e.amount, 0n);
      group.total = this.money(total, currency);
      group.items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return grouped;
  }

  private mapGoals(goals: Goal[], currency: string) {
    return goals.map((g) => {
      const progress =
        g.targetAmount > 0n
          ? Math.min(100, Number((g.currentSavings * 100n) / g.targetAmount))
          : 0;
      return {
        name: g.name,
        type: g.type,
        targetAmount: this.money(g.targetAmount, currency),
        currentSavings: this.money(g.currentSavings, currency),
        progressPercent: progress,
        targetDate: g.targetDate?.toISOString() ?? null,
        isCompleted: g.isCompleted,
        priority: g.priority,
      };
    });
  }

  private mapLoans(loans: Loan[], currency: string) {
    return loans.map((l) => ({
      name: l.name,
      type: l.type,
      principal: this.money(l.principal, currency),
      emiAmount: this.money(l.emiAmount, currency),
      remainingBalance: this.money(l.remainingBalance, currency),
      interestRate: l.interestRate.toString(),
      tenureMonths: l.tenureMonths,
      lender: l.lender,
    }));
  }

  private mapSavingsAccounts(accounts: SavingsAccount[], currency: string) {
    return accounts.map((a) => ({
      name: a.name,
      type: a.type,
      balance: this.money(a.balance, currency),
      institution: a.institution,
      interestRate: a.interestRate?.toString() ?? null,
    }));
  }

  private withDisplayName<T extends { period: ReportPeriod; format: ReportFormat; startDate: Date; endDate: Date; metadata: unknown }>(
    report: T,
  ) {
    const meta = (report.metadata ?? {}) as Record<string, unknown>;
    return {
      ...report,
      name:
        (typeof meta.name === 'string' && meta.name) ||
        this.buildReportName(report.period, report.format, report.startDate, report.endDate),
    };
  }

  async generate(userId: string, dto: GenerateReportDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currency = user?.currency ?? 'INR';
    const { startDate, endDate } = this.resolveDateRange(dto.period, dto.startDate, dto.endDate);

    const [incomes, expenses, loans, goals, savings] = await Promise.all([
      this.prisma.income.findMany({
        where: { userId, deletedAt: null, date: { gte: startDate, lte: endDate } },
      }),
      this.prisma.expense.findMany({
        where: { userId, deletedAt: null, date: { gte: startDate, lte: endDate } },
      }),
      this.prisma.loan.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.goal.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.savingsAccount.findMany({ where: { userId, deletedAt: null } }),
    ]);

    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0n);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0n);
    const netSavings = totalIncome - totalExpenses;

    const expenseByCategory = expenses.reduce(
      (acc, e) => {
        acc[e.category] = (acc[e.category] ?? 0n) + e.amount;
        return acc;
      },
      {} as Record<string, bigint>,
    );

    const name = this.buildReportName(dto.period, dto.format, startDate, endDate);

    const totalSavingsBalance = savings.reduce((s, a) => s + a.balance, 0n);

    const metadata = {
      name,
      period: dto.period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      summary: {
        totalIncome: this.money(totalIncome, currency),
        totalExpenses: this.money(totalExpenses, currency),
        netSavings: this.money(netSavings > 0n ? netSavings : 0n, currency),
        savingsRate:
          totalIncome > 0n
            ? Number(((totalIncome - totalExpenses) * 100n) / totalIncome)
            : 0,
      },
      expenseByCategory: Object.fromEntries(
        Object.entries(expenseByCategory).map(([k, v]) => [k, this.money(v, currency)]),
      ),
      incomes: this.mapIncomes(incomes, currency),
      expenses: this.mapExpensesByCategory(expenses, currency),
      goals: this.mapGoals(goals, currency),
      loans: this.mapLoans(loans, currency),
      savingsAccounts: this.mapSavingsAccounts(savings, currency),
      activeLoans: loans.length,
      activeGoals: goals.filter((g) => !g.isCompleted).length,
      totalSavingsBalance: this.money(totalSavingsBalance, currency),
      transactionCount: { income: incomes.length, expenses: expenses.length },
    };

    const fileUrl = this.buildExportUrl(dto.format, metadata);

    const created = await this.prisma.report.create({
      data: {
        userId,
        period: dto.period,
        format: dto.format,
        startDate,
        endDate,
        fileUrl,
        metadata,
      },
    });
    return this.withDisplayName(created);
  }

  async findAll(userId: string) {
    const reports = await this.prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return reports.map((r) => this.withDisplayName(r));
  }

  async findOne(userId: string, id: string) {
    const report = await this.prisma.report.findFirst({ where: { id, userId } });
    if (!report) throw new NotFoundException('Report not found');
    return this.withDisplayName(report);
  }

  async delete(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.report.delete({ where: { id } });
    return { success: true };
  }

  private resolveDateRange(
    period: ReportPeriod,
    customStart?: string,
    customEnd?: string,
  ): { startDate: Date; endDate: Date } {
    const now = new Date();
    const endDate = customEnd ? new Date(customEnd) : now;
    let startDate: Date;

    if (customStart) {
      startDate = new Date(customStart);
    } else {
      startDate = new Date(now);
      switch (period) {
        case ReportPeriod.DAILY:
          startDate.setDate(startDate.getDate() - 1);
          break;
        case ReportPeriod.WEEKLY:
          startDate.setDate(startDate.getDate() - 7);
          break;
        case ReportPeriod.MONTHLY:
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case ReportPeriod.YEARLY:
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }
    }

    return { startDate, endDate };
  }

  private buildExportUrl(format: ReportFormat, metadata: Record<string, unknown>): string {
    const timestamp = Date.now();
    switch (format) {
      case ReportFormat.PDF:
        return `/exports/reports/${timestamp}.pdf`;
      case ReportFormat.EXCEL:
        return `/exports/reports/${timestamp}.xlsx`;
      case ReportFormat.CSV:
        return `/exports/reports/${timestamp}.csv`;
      default:
        return `/exports/reports/${timestamp}.json`;
    }
  }

  async exportExcel(userId: string, reportId: string): Promise<Buffer> {
    const report = await this.findOne(userId, reportId);
    const meta = (report.metadata ?? {}) as Record<string, unknown>;
    const name =
      (typeof meta.name === 'string' && meta.name) ||
      this.buildReportName(report.period, report.format, report.startDate, report.endDate);
    return buildReportExcel(name, report.startDate, report.endDate, meta);
  }

  async exportCsv(userId: string, reportId: string): Promise<string> {
    const report = await this.findOne(userId, reportId);
    const meta = report.metadata as Record<string, unknown>;
    const summary = meta.summary as Record<string, string>;
    const lines: string[] = [
      'Section,Category,Name,Type,Date,Amount,Details',
      `Summary,,Total Income,,,${summary?.totalIncome ?? ''},`,
      `Summary,,Total Expenses,,,${summary?.totalExpenses ?? ''},`,
      `Summary,,Net Savings,,,${summary?.netSavings ?? ''},`,
    ];

    const incomes = (meta.incomes ?? []) as {
      type: string;
      amount: string;
      date: string;
      category: string | null;
      notes: string | null;
    }[];
    for (const i of incomes) {
      lines.push(
        `Income,,${i.type},${i.type},${i.date},${i.amount},${[i.category, i.notes].filter(Boolean).join(', ')}`,
      );
    }

    const expenses = meta.expenses as Record<
      string,
      { total: string; items: { date: string; description: string; merchant: string; amount: string }[] }
    >;
    if (expenses) {
      for (const [category, group] of Object.entries(expenses)) {
        lines.push(`Expenses,${category},Category Total,,,${group.total},`);
        for (const item of group.items) {
          lines.push(
            `Expenses,${category},${item.description},,${item.date},${item.amount},${item.merchant}`,
          );
        }
      }
    }

    const goals = (meta.goals ?? []) as {
      name: string;
      type: string;
      targetAmount: string;
      currentSavings: string;
      progressPercent: number;
      isCompleted: boolean;
    }[];
    for (const g of goals) {
      lines.push(
        `Goals,,${g.name},${g.type},,${g.currentSavings}/${g.targetAmount},${g.progressPercent}%${g.isCompleted ? ' completed' : ''}`,
      );
    }

    const loans = (meta.loans ?? []) as {
      name: string;
      type: string;
      emiAmount: string;
      remainingBalance: string;
    }[];
    for (const l of loans) {
      lines.push(
        `Loans,,${l.name},${l.type},,${l.remainingBalance},EMI ${l.emiAmount}`,
      );
    }

    const savingsAccounts = (meta.savingsAccounts ?? []) as {
      name: string;
      type: string;
      balance: string;
      institution: string | null;
    }[];
    for (const a of savingsAccounts) {
      lines.push(
        `Savings,,${a.name},${a.type},,${a.balance},${a.institution ?? ''}`,
      );
    }

    return lines.join('\n');
  }
}
