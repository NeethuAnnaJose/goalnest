import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLoanDto, UpdateLoanDto, RecordEmiPaymentDto } from './dto/loan.dto';
import { toMinorUnits, fromMinorUnits } from '../../common/utils/money.util';
import { calculateEmi, calculateRemainingMonths } from '../../common/utils/emi.util';
import { EmiPaymentStatus } from '@prisma/client';

@Injectable()
export class LoansService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateLoanDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currency = user?.currency ?? 'INR';
    const principal = toMinorUnits(dto.principal, currency);
    const emiResult = calculateEmi({
      principal,
      annualInterestRate: dto.interestRate,
      tenureMonths: dto.tenureMonths,
      currency,
    });

    const loan = await this.prisma.loan.create({
      data: {
        userId,
        type: dto.type,
        name: dto.name,
        principal,
        interestRate: dto.interestRate,
        tenureMonths: dto.tenureMonths,
        startDate: new Date(dto.startDate),
        emiAmount: emiResult.emiAmount,
        remainingBalance: principal,
        currency,
        lender: dto.lender,
        notes: dto.notes,
      },
    });

    await this.generateEmiSchedule(loan.id, emiResult.emiAmount, dto.tenureMonths, new Date(dto.startDate));
    return this.findOne(userId, loan.id);
  }

  private async generateEmiSchedule(
    loanId: string,
    emiAmount: bigint,
    tenureMonths: number,
    startDate: Date,
  ) {
    const payments = [];
    for (let i = 0; i < tenureMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i + 1);
      payments.push({ loanId, dueDate, amount: emiAmount, status: EmiPaymentStatus.PENDING });
    }
    await this.prisma.emiPayment.createMany({ data: payments });
  }

  async findAll(userId: string) {
    return this.prisma.loan.findMany({
      where: { userId, deletedAt: null },
      include: { emis: { orderBy: { dueDate: 'asc' }, take: 3 } },
    });
  }

  async findOne(userId: string, id: string) {
    const loan = await this.prisma.loan.findFirst({
      where: { id, userId, deletedAt: null },
      include: { emis: { orderBy: { dueDate: 'asc' } } },
    });
    if (!loan) throw new NotFoundException('Loan not found');

    const remainingMonths = calculateRemainingMonths({
      remainingBalance: loan.remainingBalance,
      emiAmount: loan.emiAmount,
      annualInterestRate: loan.interestRate.toString(),
    });
    const completionDate = new Date();
    completionDate.setMonth(completionDate.getMonth() + remainingMonths);

    const emiCalc = calculateEmi({
      principal: loan.principal,
      annualInterestRate: loan.interestRate.toString(),
      tenureMonths: loan.tenureMonths,
      currency: loan.currency,
    });

    return {
      ...loan,
      totalInterest: emiCalc.totalInterest,
      completionDate,
      remainingMonths,
      emiAmountMajor: fromMinorUnits(loan.emiAmount, loan.currency),
    };
  }

  async update(userId: string, id: string, dto: UpdateLoanDto) {
    const loan = await this.findOne(userId, id);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currency = user?.currency ?? 'INR';

    const principal = dto.principal
      ? toMinorUnits(dto.principal, currency)
      : loan.principal;
    const interestRate = dto.interestRate ?? loan.interestRate.toString();
    const tenureMonths = dto.tenureMonths ?? loan.tenureMonths;
    const startDate = dto.startDate ? new Date(dto.startDate) : loan.startDate;

    const emiResult = calculateEmi({
      principal,
      annualInterestRate: interestRate,
      tenureMonths,
      currency,
    });

    const paidEmiCount = await this.prisma.emiPayment.count({
      where: { loanId: id, status: EmiPaymentStatus.PAID },
    });

    const updateData: Record<string, unknown> = {
      ...(dto.name && { name: dto.name }),
      ...(dto.type && { type: dto.type }),
      ...(dto.lender !== undefined && { lender: dto.lender }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      principal,
      interestRate,
      tenureMonths,
      startDate,
      emiAmount: emiResult.emiAmount,
    };

    if (paidEmiCount === 0) {
      updateData.remainingBalance = principal;
      await this.prisma.emiPayment.deleteMany({ where: { loanId: id } });
      await this.generateEmiSchedule(id, emiResult.emiAmount, tenureMonths, startDate);
    } else {
      await this.prisma.emiPayment.updateMany({
        where: { loanId: id, status: EmiPaymentStatus.PENDING },
        data: { amount: emiResult.emiAmount },
      });
    }

    await this.prisma.loan.update({ where: { id }, data: updateData });
    return this.findOne(userId, id);
  }

  async recordEmiPayment(userId: string, loanId: string, emiId: string, dto: RecordEmiPaymentDto) {
    await this.findOne(userId, loanId);
    const emi = await this.prisma.emiPayment.findFirst({ where: { id: emiId, loanId } });
    if (!emi) throw new NotFoundException('EMI payment not found');

    await this.prisma.$transaction([
      this.prisma.emiPayment.update({
        where: { id: emiId },
        data: { status: EmiPaymentStatus.PAID, paidDate: new Date(dto.paidDate), notes: dto.notes },
      }),
      this.prisma.loan.update({
        where: { id: loanId },
        data: { remainingBalance: { decrement: emi.amount } },
      }),
    ]);

    return { success: true };
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.loan.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getUpcomingEmis(userId: string, days = 30) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    return this.prisma.emiPayment.findMany({
      where: {
        status: EmiPaymentStatus.PENDING,
        dueDate: { lte: endDate, gte: new Date() },
        loan: { userId, deletedAt: null },
      },
      include: { loan: { select: { name: true, type: true } } },
      orderBy: { dueDate: 'asc' },
    });
  }
}
