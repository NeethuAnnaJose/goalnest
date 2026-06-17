import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import {

  CreateNotificationDto,

  NotificationFilterDto,

  UpdateNotificationPrefsDto,

} from './dto/notification.dto';

import {

  EmiPaymentStatus,

  ExpenseCategory,

  GoalType,

  NotificationChannel,

  NotificationType,

  Prisma,

} from '@prisma/client';

import {

  buildBudgetExceededBody,

  buildEmiReminderBody,

  buildEmiReminderTitle,

  buildGoalProgressBody,

  EMI_ALERT_DAYS,

  getCategoryBudget,

  getCurrentMonthRange,

  GOAL_MILESTONES,

  isPrefEnabled,

} from './utils/notification-alerts.util';



@Injectable()

export class NotificationsService {

  constructor(private prisma: PrismaService) {}



  async create(userId: string, dto: CreateNotificationDto) {

    const notification = await this.prisma.notification.create({

      data: {

        userId,

        type: dto.type,

        channel: dto.channel,

        title: dto.title,

        body: dto.body,

        data: (dto.data ?? undefined) as Prisma.InputJsonValue | undefined,

        sentAt: new Date(),

      },

    });



    await this.dispatch(userId, notification);

    return notification;

  }



  async findAll(userId: string, filters: NotificationFilterDto) {

    const where: Record<string, unknown> = { userId };

    if (filters.unreadOnly) where.isRead = false;

    if (filters.type) where.type = filters.type;



    return this.prisma.notification.findMany({

      where,

      orderBy: { createdAt: 'desc' },

      take: 100,

    });

  }



  async markRead(userId: string, notificationId: string) {

    const notification = await this.prisma.notification.findFirst({

      where: { id: notificationId, userId },

    });

    if (!notification) throw new NotFoundException('Notification not found');



    return this.prisma.notification.update({

      where: { id: notificationId },

      data: { isRead: true, readAt: new Date() },

    });

  }



  async markAllRead(userId: string) {

    await this.prisma.notification.updateMany({

      where: { userId, isRead: false },

      data: { isRead: true, readAt: new Date() },

    });

    return { success: true };

  }



  async delete(userId: string, notificationId: string) {

    const notification = await this.prisma.notification.findFirst({

      where: { id: notificationId, userId },

    });

    if (!notification) throw new NotFoundException('Notification not found');



    await this.prisma.notification.delete({ where: { id: notificationId } });

    return { success: true };

  }



  async getUnreadCount(userId: string) {

    const count = await this.prisma.notification.count({

      where: { userId, isRead: false },

    });

    return { count };

  }



  async updatePreferences(userId: string, dto: UpdateNotificationPrefsDto) {

    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });

    const existing = (profile?.notificationPrefs as Record<string, unknown>) ?? {};



    return this.prisma.userProfile.upsert({

      where: { userId },

      create: {

        userId,

        notificationPrefs: { ...existing, ...dto },

      },

      update: {

        notificationPrefs: { ...existing, ...dto },

      },

    });

  }



  async sendEmiReminders(userId: string) {

    const prefs = await this.getUserPrefs(userId);

    if (!isPrefEnabled(prefs, 'emiReminders')) return [];



    const sent = [];

    for (const daysUntil of EMI_ALERT_DAYS) {

      const targetDate = new Date();

      targetDate.setDate(targetDate.getDate() + daysUntil);

      const start = new Date(targetDate);

      start.setHours(0, 0, 0, 0);

      const end = new Date(targetDate);

      end.setHours(23, 59, 59, 999);



      const emis = await this.prisma.emiPayment.findMany({

        where: {

          status: EmiPaymentStatus.PENDING,

          dueDate: { gte: start, lte: end },

          loan: { userId, deletedAt: null },

        },

        include: { loan: { select: { name: true } } },

      });



      for (const emi of emis) {

        const dedupKey = `emi:${emi.id}:${daysUntil}`;

        if (await this.hasRecentNotification(userId, NotificationType.EMI_REMINDER, dedupKey)) {

          continue;

        }



        const notification = await this.create(userId, {

          type: NotificationType.EMI_REMINDER,

          channel: NotificationChannel.IN_APP,

          title: buildEmiReminderTitle(daysUntil),

          body: buildEmiReminderBody(emi.loan.name, daysUntil),

          data: {

            dedupKey,

            emiId: emi.id,

            loanId: emi.loanId,

            daysUntil,

            amount: emi.amount.toString(),

          },

        });

        sent.push(notification);

      }

    }

    return sent;

  }



  async sendOverspendingAlerts(userId: string) {

    const prefs = await this.getUserPrefs(userId);

    if (!isPrefEnabled(prefs, 'overspendingAlerts')) return [];



    const user = await this.prisma.user.findUnique({

      where: { id: userId },

      select: { financialPreferences: true, monthlySalary: true },

    });

    if (!user) return [];



    const financialPrefs = (user.financialPreferences as Record<string, unknown>) ?? {};

    const { start, end, monthKey } = getCurrentMonthRange();

    const sent = [];



    for (const category of Object.values(ExpenseCategory)) {

      const budget = getCategoryBudget(financialPrefs, category, user.monthlySalary);

      if (!budget) continue;



      const expenses = await this.prisma.expense.findMany({

        where: {

          userId,

          category,

          deletedAt: null,

          date: { gte: start, lte: end },

        },

      });



      const spent = expenses.reduce((sum, e) => sum + e.amount, 0n);

      if (spent <= budget) continue;



      const dedupKey = `budget:${category}:${monthKey}`;

      if (await this.hasRecentNotification(userId, NotificationType.OVERSPENDING, dedupKey)) {

        continue;

      }



      const notification = await this.create(userId, {

        type: NotificationType.OVERSPENDING,

        channel: NotificationChannel.IN_APP,

        title: 'Budget Exceeded',

        body: buildBudgetExceededBody(category),

        data: {

          dedupKey,

          category,

          month: monthKey,

          spent: spent.toString(),

          budget: budget.toString(),

        },

      });

      sent.push(notification);

    }



    return sent;

  }



  async sendGoalProgressAlerts(userId: string) {

    const prefs = await this.getUserPrefs(userId);

    if (!isPrefEnabled(prefs, 'goalProgress')) return [];



    const goals = await this.prisma.goal.findMany({

      where: { userId, deletedAt: null, isCompleted: false },

    });



    const sent = [];

    for (const goal of goals) {

      if (goal.targetAmount <= 0n) continue;



      const completionPercent = Number((goal.currentSavings * 100n) / goal.targetAmount);

      const goalLabel = goal.type === GoalType.HOUSE ? 'house' : goal.name;



      for (const milestone of GOAL_MILESTONES) {

        if (completionPercent < milestone) continue;



        const dedupKey = `goal:${goal.id}:${milestone}`;

        if (await this.hasRecentNotification(userId, NotificationType.GOAL_PROGRESS, dedupKey)) {

          continue;

        }



        const notification = await this.create(userId, {

          type: NotificationType.GOAL_PROGRESS,

          channel: NotificationChannel.IN_APP,

          title: 'Goal Milestone',

          body: buildGoalProgressBody(goalLabel, milestone),

          data: {

            dedupKey,

            goalId: goal.id,

            goalType: goal.type,

            milestone,

            completionPercent,

          },

        });

        sent.push(notification);

      }

    }



    return sent;

  }



  async processUserAlerts(userId: string) {

    const emi = await this.sendEmiReminders(userId);

    const overspending = await this.sendOverspendingAlerts(userId);

    const goals = await this.sendGoalProgressAlerts(userId);



    return {

      emiReminders: emi.length,

      overspendingAlerts: overspending.length,

      goalProgressAlerts: goals.length,

      notifications: [...emi, ...overspending, ...goals],

    };

  }



  async processAllUserAlerts() {

    const users = await this.prisma.user.findMany({

      where: { deletedAt: null },

      select: { id: true },

    });



    let total = 0;

    for (const user of users) {

      const result = await this.processUserAlerts(user.id);

      total += result.notifications.length;

    }

    return { usersProcessed: users.length, notificationsSent: total };

  }



  async checkBudgetAfterExpense(userId: string, category: ExpenseCategory) {
    const prefs = await this.getUserPrefs(userId);
    if (!isPrefEnabled(prefs, 'overspendingAlerts')) return null;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { financialPreferences: true, monthlySalary: true },
    });
    if (!user) return null;

    const financialPrefs = (user.financialPreferences as Record<string, unknown>) ?? {};
    const budget = getCategoryBudget(financialPrefs, category, user.monthlySalary);
    if (!budget) return null;

    const { start, end, monthKey } = getCurrentMonthRange();
    const expenses = await this.prisma.expense.findMany({
      where: {
        userId,
        category,
        deletedAt: null,
        date: { gte: start, lte: end },
      },
    });

    const spent = expenses.reduce((sum, e) => sum + e.amount, 0n);
    if (spent <= budget) return null;

    const dedupKey = `budget:${category}:${monthKey}`;
    if (await this.hasRecentNotification(userId, NotificationType.OVERSPENDING, dedupKey)) {
      return null;
    }

    return this.create(userId, {
      type: NotificationType.OVERSPENDING,
      channel: NotificationChannel.IN_APP,
      title: 'Budget Limit Exceeded',
      body: buildBudgetExceededBody(category),
      data: {
        dedupKey,
        category,
        month: monthKey,
        spent: spent.toString(),
        budget: budget.toString(),
      },
    });
  }



  async checkGoalAfterProgress(userId: string, goalId: string) {

    const goal = await this.prisma.goal.findFirst({

      where: { id: goalId, userId, deletedAt: null },

    });

    if (!goal || goal.isCompleted || goal.targetAmount <= 0n) return null;



    const prefs = await this.getUserPrefs(userId);

    if (!isPrefEnabled(prefs, 'goalProgress')) return null;



    const completionPercent = Number((goal.currentSavings * 100n) / goal.targetAmount);

    const goalLabel = goal.type === GoalType.HOUSE ? 'house' : goal.name;

    const milestone = GOAL_MILESTONES.filter((m) => completionPercent >= m).pop();

    if (!milestone) return null;



    const dedupKey = `goal:${goal.id}:${milestone}`;

    if (await this.hasRecentNotification(userId, NotificationType.GOAL_PROGRESS, dedupKey)) {

      return null;

    }



    return this.create(userId, {

      type: NotificationType.GOAL_PROGRESS,

      channel: NotificationChannel.IN_APP,

      title: 'Goal Milestone',

      body: buildGoalProgressBody(goalLabel, milestone),

      data: {

        dedupKey,

        goalId: goal.id,

        goalType: goal.type,

        milestone,

        completionPercent,

      },

    });

  }



  private async getUserPrefs(userId: string): Promise<Record<string, unknown>> {

    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });

    return (profile?.notificationPrefs as Record<string, unknown>) ?? {};

  }



  private async hasRecentNotification(

    userId: string,

    type: NotificationType,

    dedupKey: string,

  ): Promise<boolean> {

    const existing = await this.prisma.notification.findFirst({

      where: {

        userId,

        type,

        data: { path: ['dedupKey'], equals: dedupKey },

      },

    });

    return existing !== null;

  }



  private async dispatch(

    userId: string,

    notification: { channel: NotificationChannel; title: string; body: string },

  ) {

    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });

    const prefs = (profile?.notificationPrefs as Record<string, boolean>) ?? {};



    if (notification.channel === NotificationChannel.EMAIL && prefs.emailEnabled !== false) {

      // Email dispatch via nodemailer would go here

    }

    if (notification.channel === NotificationChannel.PUSH && prefs.pushEnabled !== false) {

      const devices = await this.prisma.device.findMany({

        where: { userId, deletedAt: null, pushToken: { not: null } },

      });

      // Push notification dispatch via FCM would go here

      void devices;

    }

    if (notification.channel === NotificationChannel.SMS && prefs.smsEnabled === true) {

      // SMS dispatch via Twilio would go here

    }

  }

}


