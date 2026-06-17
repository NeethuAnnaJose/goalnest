import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateGoalDto, UpdateGoalDto, UpdateGoalProgressDto } from './dto/goal.dto';
import { toMinorUnits, fromMinorUnits } from '../../common/utils/money.util';

@Injectable()
export class GoalsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateGoalDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currency = user?.currency ?? 'INR';
    return this.prisma.goal.create({
      data: {
        userId,
        type: dto.type,
        name: dto.name,
        targetAmount: toMinorUnits(dto.targetAmount, currency),
        currentSavings: dto.currentSavings ? toMinorUnits(dto.currentSavings, currency) : 0n,
        currency,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        priority: dto.priority ?? 1,
        notes: dto.notes,
      },
    });
  }

  async findAll(userId: string) {
    const goals = await this.prisma.goal.findMany({
      where: { userId, deletedAt: null },
      orderBy: { priority: 'asc' },
    });
    return goals.map((g) => this.enrichGoal(g));
  }

  private enrichGoal(goal: {
    id: string;
    name: string;
    targetAmount: bigint;
    currentSavings: bigint;
    targetDate: Date | null;
    currency: string;
    isCompleted: boolean;
    type: string;
    priority: number;
    notes: string | null;
    createdAt: Date;
  }) {
    const remaining = goal.targetAmount - goal.currentSavings;
    const completionPercent =
      goal.targetAmount > 0n
        ? Number((goal.currentSavings * 100n) / goal.targetAmount)
        : 0;

    let requiredMonthlySaving = 0n;
    let expectedCompletionDate: Date | null = null;

    if (remaining > 0n && goal.targetDate) {
      const monthsRemaining = Math.max(
        1,
        Math.ceil(
          (goal.targetDate.getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000),
        ),
      );
      requiredMonthlySaving = remaining / BigInt(monthsRemaining);
      expectedCompletionDate = goal.targetDate;
    } else if (remaining <= 0n) {
      expectedCompletionDate = new Date();
    }

    return {
      ...goal,
      remainingAmount: remaining,
      completionPercent: Math.min(100, completionPercent),
      requiredMonthlySaving,
      expectedCompletionDate,
      remainingAmountMajor: fromMinorUnits(remaining > 0n ? remaining : 0n, goal.currency),
      targetAmountMajor: fromMinorUnits(goal.targetAmount, goal.currency),
      currentSavingsMajor: fromMinorUnits(goal.currentSavings, goal.currency),
    };
  }

  async findOne(userId: string, id: string) {
    const goal = await this.prisma.goal.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!goal) throw new NotFoundException('Goal not found');
    return this.enrichGoal(goal);
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    await this.findOne(userId, id);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currency = user?.currency ?? 'INR';
    const data: Record<string, unknown> = {};
    if (dto.name) data.name = dto.name;
    if (dto.targetAmount) data.targetAmount = toMinorUnits(dto.targetAmount, currency);
    if (dto.targetDate !== undefined) {
      data.targetDate = dto.targetDate ? new Date(dto.targetDate) : null;
    }
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.priority !== undefined) data.priority = dto.priority;
    const updated = await this.prisma.goal.update({ where: { id }, data });
    return this.enrichGoal(updated);
  }

  async updateProgress(userId: string, id: string, dto: UpdateGoalProgressDto) {
    const goal = await this.findOne(userId, id);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const addAmount = toMinorUnits(dto.amount, user?.currency ?? 'INR');
    const newSavings = goal.currentSavings + addAmount;
    const isCompleted = newSavings >= goal.targetAmount;

    const updated = await this.prisma.goal.update({
      where: { id },
      data: {
        currentSavings: newSavings,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    await this.notificationsService.checkGoalAfterProgress(userId, id);
    return updated;
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.goal.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
