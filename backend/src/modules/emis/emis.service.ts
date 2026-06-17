import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmiFilterDto, RecordEmiDto } from './dto/emi.dto';
import { EmiPaymentStatus } from '@prisma/client';
import { fromMinorUnits } from '../../common/utils/money.util';
import {
  effectiveMonthInFY,
  getCurrentFinancialYear,
  monthsInFinancialYear,
} from '../../common/utils/financial-year.util';

@Injectable()
export class EmisService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, filters: EmiFilterDto) {
    const where: Record<string, unknown> = {
      loan: { userId, deletedAt: null },
    };
    if (filters.status) where.status = filters.status;
    if (filters.loanId) where.loanId = filters.loanId;
    if (filters.days) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + filters.days);
      where.dueDate = { lte: endDate, gte: new Date() };
    }

    const emis = await this.prisma.emiPayment.findMany({
      where,
      include: { loan: { select: { id: true, name: true, type: true, currency: true } } },
      orderBy: { dueDate: 'asc' },
    });

    return emis.map((emi) => ({
      ...emi,
      amountMajor: fromMinorUnits(emi.amount, emi.loan.currency),
      daysUntilDue: Math.ceil(
        (emi.dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
      ),
    }));
  }

  async findOne(userId: string, emiId: string) {
    const emi = await this.prisma.emiPayment.findFirst({
      where: { id: emiId, loan: { userId, deletedAt: null } },
      include: { loan: true },
    });
    if (!emi) throw new NotFoundException('EMI payment not found');
    return emi;
  }

  async recordPayment(userId: string, emiId: string, dto: RecordEmiDto) {
    const emi = await this.findOne(userId, emiId);
    if (emi.status === EmiPaymentStatus.PAID) {
      throw new BadRequestException('EMI already paid');
    }

    await this.prisma.$transaction([
      this.prisma.emiPayment.update({
        where: { id: emiId },
        data: {
          status: EmiPaymentStatus.PAID,
          paidDate: new Date(dto.paidDate),
          notes: dto.notes,
        },
      }),
      this.prisma.loan.update({
        where: { id: emi.loanId },
        data: { remainingBalance: { decrement: emi.amount } },
      }),
    ]);

    return { success: true };
  }

  async unpayEmi(userId: string, emiId: string) {
    const emi = await this.findOne(userId, emiId);
    if (emi.status !== EmiPaymentStatus.PAID) {
      throw new BadRequestException('EMI is not marked as paid');
    }

    await this.prisma.$transaction([
      this.prisma.emiPayment.update({
        where: { id: emiId },
        data: {
          status: EmiPaymentStatus.PENDING,
          paidDate: null,
          notes: null,
        },
      }),
      this.prisma.loan.update({
        where: { id: emi.loanId },
        data: { remainingBalance: { increment: emi.amount } },
      }),
    ]);

    return { success: true };
  }

  async markMissed(userId: string, emiId: string) {
    const emi = await this.findOne(userId, emiId);
    if (emi.dueDate > new Date()) {
      throw new NotFoundException('EMI is not yet overdue');
    }
    return this.prisma.emiPayment.update({
      where: { id: emiId },
      data: { status: EmiPaymentStatus.MISSED },
    });
  }

  async getTracker(userId: string, loanId: string) {
    const loan = await this.prisma.loan.findFirst({
      where: { id: loanId, userId, deletedAt: null },
      include: { emis: { orderBy: { dueDate: 'asc' } } },
    });
    if (!loan) throw new NotFoundException('Loan not found');

    const paid = loan.emis.filter((e) => e.status === EmiPaymentStatus.PAID).length;
    const missed = loan.emis.filter((e) => e.status === EmiPaymentStatus.MISSED).length;
    const pending = loan.emis.filter((e) => e.status === EmiPaymentStatus.PENDING).length;

    return {
      loanId: loan.id,
      loanName: loan.name,
      totalEmis: loan.emis.length,
      paid,
      missed,
      pending,
      completionPercent: Math.round((paid / loan.emis.length) * 100),
      emis: loan.emis,
    };
  }

  private monthKeyFromDate(dueDate: Date): string {
    return `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
  }

  async getFySummary(userId: string, fy?: string) {
    const financialYear = fy ?? getCurrentFinancialYear().label;
    const fyMonthSet = new Set(monthsInFinancialYear(financialYear));
    const activeMonth = effectiveMonthInFY(financialYear, new Date());

    const emis = await this.prisma.emiPayment.findMany({
      where: { loan: { userId, deletedAt: null } },
      include: { loan: { select: { currency: true } } },
    });

    const fyEmis = emis.filter((e) => fyMonthSet.has(this.monthKeyFromDate(e.dueDate)));
    const paidEmis = fyEmis.filter((e) => e.status === EmiPaymentStatus.PAID);
    const monthlyPaid = paidEmis.filter((e) => this.monthKeyFromDate(e.dueDate) === activeMonth);

    const monthlyPaidTotal = monthlyPaid.reduce((s, e) => s + e.amount, 0n);
    const yearlyPaidTotal = paidEmis.reduce((s, e) => s + e.amount, 0n);
    const paidMonthsCount = new Set(paidEmis.map((e) => this.monthKeyFromDate(e.dueDate))).size;
    const currency = emis[0]?.loan?.currency ?? 'INR';

    return {
      financialYear,
      monthlyPaidTotal,
      yearlyPaidTotal,
      paidMonthsCount,
      emisDueInFy: fyEmis.length,
      formatted: {
        monthlyPaidTotal: fromMinorUnits(monthlyPaidTotal, currency),
        yearlyPaidTotal: fromMinorUnits(yearlyPaidTotal, currency),
      },
    };
  }

  async getAlerts(userId: string) {
    const alertDays = [7, 3, 1, 0];
    const alerts: { emiId: string; loanName: string; dueDate: Date; daysUntil: number; amount: bigint }[] = [];

    for (const days of alertDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const emis = await this.prisma.emiPayment.findMany({
        where: {
          status: EmiPaymentStatus.PENDING,
          dueDate: { gte: startOfDay, lte: endOfDay },
          loan: { userId, deletedAt: null },
        },
        include: { loan: { select: { name: true } } },
      });

      for (const emi of emis) {
        alerts.push({
          emiId: emi.id,
          loanName: emi.loan.name,
          dueDate: emi.dueDate,
          daysUntil: days,
          amount: emi.amount,
        });
      }
    }

    return alerts;
  }
}
