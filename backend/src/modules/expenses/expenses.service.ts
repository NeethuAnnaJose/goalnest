import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateExpenseDto,
  BulkImportExpenseDto,
  ExpenseFilterDto,
  UpdateExpenseDto,
  CsvImportExpenseDto,
} from './dto/expense.dto';
import { toMinorUnits } from '../../common/utils/money.util';
import { parseFinancialYear } from '../../common/utils/financial-year.util';
import { ExpenseCategory } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateExpenseDto) {
    if (dto.category === ExpenseCategory.OTHER && !dto.description?.trim()) {
      throw new BadRequestException('Please enter a name for this expense when using the Other category');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const expense = await this.prisma.expense.create({
      data: {
        userId,
        category: dto.category,
        amount: toMinorUnits(dto.amount, user?.currency ?? 'INR'),
        currency: user?.currency ?? 'INR',
        date: new Date(dto.date),
        description: dto.description,
        merchant: dto.merchant,
        isRecurring: dto.isRecurring ?? false,
        frequency: dto.frequency,
        tags: dto.tags ?? [],
      },
    });

    let budgetAlert = null;
    try {
      budgetAlert = await this.notificationsService.checkBudgetAfterExpense(userId, dto.category);
    } catch {
      // Budget alerts are best-effort; expense save should still succeed
    }
    return { expense, budgetAlert };
  }

  async bulkImport(userId: string, dto: BulkImportExpenseDto) {
    if (dto.expenses.length > 500) {
      throw new BadRequestException('Maximum 500 expenses per import');
    }
    const results = [];
    for (const expense of dto.expenses) {
      const result = await this.create(userId, expense);
      results.push(result.expense);
    }
    return { imported: results.length, expenses: results };
  }

  async findAll(userId: string, filters: ExpenseFilterDto) {
    const where: Record<string, unknown> = { userId, deletedAt: null };

    if (filters.month) {
      const [year, m] = filters.month.split('-').map(Number);
      where.date = {
        gte: new Date(year, m - 1, 1),
        lte: new Date(year, m, 0, 23, 59, 59),
      };
    } else if (filters.fy) {
      const range = parseFinancialYear(filters.fy);
      where.date = { gte: range.startDate, lte: range.endDate };
    }
    if (filters.category) where.category = filters.category;
    if (filters.search) {
      where.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { merchant: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.expense.findMany({ where, orderBy: { date: 'desc' } });
  }

  async update(userId: string, id: string, dto: UpdateExpenseDto) {
    await this.findOne(userId, id);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const data: Record<string, unknown> = { ...dto };
    if (dto.amount) data.amount = toMinorUnits(dto.amount, user?.currency ?? 'INR');
    if (dto.date) data.date = new Date(dto.date);
    return this.prisma.expense.update({ where: { id }, data });
  }

  async importCsv(userId: string, dto: CsvImportExpenseDto) {
    const lines = dto.csv.trim().split('\n');
    if (lines.length < 2) throw new BadRequestException('CSV must have header and at least one row');

    const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
    const categoryIdx = header.indexOf('category');
    const amountIdx = header.indexOf('amount');
    const dateIdx = header.indexOf('date');

    if (categoryIdx === -1 || amountIdx === -1 || dateIdx === -1) {
      throw new BadRequestException('CSV must include category, amount, and date columns');
    }

    const descIdx = header.indexOf('description');
    const merchantIdx = header.indexOf('merchant');
    const expenses: CreateExpenseDto[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      if (cols.length < 3) continue;
      const category = cols[categoryIdx].toUpperCase() as ExpenseCategory;
      if (!Object.values(ExpenseCategory).includes(category)) {
        throw new BadRequestException(`Invalid category: ${cols[categoryIdx]}`);
      }
      expenses.push({
        category,
        amount: cols[amountIdx],
        date: cols[dateIdx],
        description: descIdx >= 0 ? cols[descIdx] : undefined,
        merchant: merchantIdx >= 0 ? cols[merchantIdx] : undefined,
      });
    }

    return this.bulkImport(userId, { expenses });
  }

  async findOne(userId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getCategoryBreakdown(userId: string, month?: string, fy?: string) {
    const expenses = await this.findAll(userId, { month, fy });
    const breakdown: Record<string, bigint> = {};
    for (const e of expenses) {
      breakdown[e.category] = (breakdown[e.category] ?? 0n) + e.amount;
    }
    return Object.entries(breakdown).map(([category, amount]) => ({ category, amount }));
  }

  async detectOverspending(userId: string) {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    const current = await this.getCategoryBreakdown(userId, currentMonth);
    const previous = await this.getCategoryBreakdown(userId, prevMonth);
    const prevMap = Object.fromEntries(previous.map((p) => [p.category, p.amount]));

    const alerts: { category: string; increasePercent: number; message: string }[] = [];
    for (const curr of current) {
      const prev = prevMap[curr.category] ?? 0n;
      if (prev === 0n) continue;
      const increase = Number(((curr.amount - prev) * 100n) / prev);
      if (increase >= 20) {
        alerts.push({
          category: curr.category,
          increasePercent: increase,
          message: `${curr.category} spending increased ${increase}% compared to last month.`,
        });
      }
    }
    return alerts;
  }
}
