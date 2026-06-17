import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIncomeDto, UpdateIncomeDto } from './dto/income.dto';
import { toMinorUnits } from '../../common/utils/money.util';
import { parseFinancialYear } from '../../common/utils/financial-year.util';

@Injectable()
export class IncomeService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateIncomeDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return this.prisma.income.create({
      data: {
        userId,
        type: dto.type,
        amount: toMinorUnits(dto.amount, user?.currency ?? 'INR'),
        currency: user?.currency ?? 'INR',
        date: new Date(dto.date),
        frequency: dto.frequency,
        isRecurring: dto.isRecurring ?? false,
        category: dto.category,
        notes: dto.notes,
      },
    });
  }

  async findAll(userId: string, month?: string, fy?: string) {
    const where: Record<string, unknown> = { userId, deletedAt: null };
    if (month) {
      const [year, m] = month.split('-').map(Number);
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0, 23, 59, 59);
      where.date = { gte: start, lte: end };
    } else if (fy) {
      const range = parseFinancialYear(fy);
      where.date = { gte: range.startDate, lte: range.endDate };
    }
    return this.prisma.income.findMany({ where, orderBy: { date: 'desc' } });
  }

  async findOne(userId: string, id: string) {
    const income = await this.prisma.income.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!income) throw new NotFoundException('Income not found');
    return income;
  }

  async update(userId: string, id: string, dto: UpdateIncomeDto) {
    await this.findOne(userId, id);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const data: Record<string, unknown> = { ...dto };
    if (dto.amount) data.amount = toMinorUnits(dto.amount, user?.currency ?? 'INR');
    if (dto.date) data.date = new Date(dto.date);
    return this.prisma.income.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.income.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getMonthlyTotal(userId: string, month: string): Promise<bigint> {
    const items = await this.findAll(userId, month);
    return items.reduce((sum, i) => sum + i.amount, 0n);
  }
}
