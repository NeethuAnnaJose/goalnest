import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { fromMinorUnits } from '../../common/utils/money.util';
import {
  AdminAnalyticsQueryDto,
  AdminBroadcastNotificationDto,
  AdminTicketFilterDto,
  AdminTicketReplyDto,
  AdminUpdateTicketDto,
  AdminUpdateUserDto,
  AdminUserFilterDto,
} from './dto/admin.dto';
import {
  NotificationChannel,
  PaymentStatus,
  Prisma,
  TicketStatus,
} from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      openTickets,
      activeSubscriptions,
      completedPayments,
      planBreakdown,
      revenueThisMonth,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      this.prisma.supportTicket.count({
        where: { status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] }, deletedAt: null },
      }),
      this.prisma.subscription.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.payment.findMany({
        where: { status: PaymentStatus.COMPLETED },
        select: { amount: true, currency: true },
      }),
      this.prisma.user.groupBy({
        by: ['planTier'],
        where: { deletedAt: null },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.COMPLETED, completedAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
    ]);

    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0n);
    const mrr = await this.estimateMrr();

    return {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      openTickets,
      activeSubscriptions,
      totalRevenue: fromMinorUnits(totalRevenue, 'INR'),
      revenueThisMonth: fromMinorUnits(revenueThisMonth._sum.amount ?? 0n, 'INR'),
      mrr: fromMinorUnits(mrr, 'INR'),
      planBreakdown: planBreakdown.map((p) => ({
        tier: p.planTier,
        count: p._count,
      })),
    };
  }

  async listUsers(filters: AdminUserFilterDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const where: Prisma.UserWhereInput = {};

    if (filters.role) where.role = filters.role;
    if (filters.planTier) where.planTier = filters.planTier;
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          planTier: true,
          currency: true,
          emailVerified: true,
          mfaEnabled: true,
          lastLoginAt: true,
          deletedAt: true,
          createdAt: true,
          _count: {
            select: {
              expenses: true,
              goals: true,
              supportTickets: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        planTier: true,
        currency: true,
        country: true,
        monthlySalary: true,
        emailVerified: true,
        mfaEnabled: true,
        lastLoginAt: true,
        deletedAt: true,
        createdAt: true,
        subscriptions: { where: { deletedAt: null }, take: 10 },
        payments: { orderBy: { createdAt: 'desc' }, take: 10 },
        supportTickets: { where: { deletedAt: null }, take: 5 },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(id: string, dto: AdminUpdateUserDto, adminId: string) {
    const user = await this.getUser(id);
    const data: Prisma.UserUpdateInput = {};
    if (dto.role) data.role = dto.role;
    if (dto.planTier) data.planTier = dto.planTier;
    if (dto.suspended !== undefined) {
      data.deletedAt = dto.suspended ? new Date() : null;
    }

    const updated = await this.prisma.user.update({ where: { id }, data });

    await this.prisma.auditLog.create({
      data: {
        userId: id,
        adminId,
        action: 'ADMIN_UPDATE_USER',
        entity: 'User',
        entityId: id,
        oldValues: { role: user.role, planTier: user.planTier, deletedAt: user.deletedAt },
        newValues: dto as Prisma.InputJsonValue,
      },
    });

    return updated;
  }

  async listSubscriptions(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where: { deletedAt: null },
        include: { user: { select: { id: true, email: true, name: true } } },
        orderBy: { renewalDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.subscription.count({ where: { deletedAt: null } }),
    ]);

    return {
      subscriptions: items.map((s) => ({
        ...s,
        amountMajor: fromMinorUnits(s.amount, s.currency),
      })),
      total,
      page,
      limit,
    };
  }

  async listPlans() {
    return this.prisma.plan.findMany({ orderBy: { priceMonthly: 'asc' } });
  }

  async getAnalytics(query: AdminAnalyticsQueryDto) {
    const days = query.days ?? 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [
      userSignups,
      revenueByDay,
      expenseTotals,
      topEvents,
      reportsGenerated,
      aiInsightsGenerated,
    ] = await Promise.all([
      this.prisma.user.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: since } },
        _count: true,
      }),
      this.prisma.payment.findMany({
        where: { status: PaymentStatus.COMPLETED, completedAt: { gte: since } },
        select: { amount: true, completedAt: true, planTier: true },
      }),
      this.prisma.expense.aggregate({
        where: { deletedAt: null, date: { gte: since } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.analyticsEvent.groupBy({
        by: ['event'],
        where: { createdAt: { gte: since } },
        _count: true,
        orderBy: { _count: { event: 'desc' } },
        take: 10,
      }),
      this.prisma.report.count({ where: { createdAt: { gte: since } } }),
      this.prisma.aiInsight.count({ where: { createdAt: { gte: since } } }),
    ]);

    const signupTrend = this.groupByDate(
      userSignups.map((u) => ({ date: u.createdAt, count: u._count })),
      days,
    );

    const revenueTrend = this.groupPaymentsByDate(revenueByDay, days);

    return {
      periodDays: days,
      signups: signupTrend,
      revenue: revenueTrend,
      totalExpensesTracked: expenseTotals._count,
      totalExpenseVolume: fromMinorUnits(expenseTotals._sum.amount ?? 0n, 'INR'),
      reportsGenerated,
      aiInsightsGenerated,
      topEvents: topEvents.map((e) => ({ event: e.event, count: e._count })),
    };
  }

  async listReports(page = 1, limit = 20) {
    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        include: { user: { select: { id: true, email: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.report.count(),
    ]);
    return { reports, total, page, limit };
  }

  async getRevenue(period: 'month' | 'year' | 'all' = 'month') {
    const where: Prisma.PaymentWhereInput = { status: PaymentStatus.COMPLETED };
    const now = new Date();

    if (period === 'month') {
      where.completedAt = { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    } else if (period === 'year') {
      where.completedAt = { gte: new Date(now.getFullYear(), 0, 1) };
    }

    const [payments, byTier, byProvider] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: { user: { select: { email: true, name: true } } },
        orderBy: { completedAt: 'desc' },
        take: 100,
      }),
      this.prisma.payment.groupBy({
        by: ['planTier'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.groupBy({
        by: ['provider'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const total = payments.reduce((sum, p) => sum + p.amount, 0n);

    return {
      period,
      total: fromMinorUnits(total, 'INR'),
      byTier: byTier.map((t) => ({
        tier: t.planTier,
        count: t._count,
        amount: fromMinorUnits(t._sum.amount ?? 0n, 'INR'),
      })),
      byProvider: byProvider.map((p) => ({
        provider: p.provider,
        count: p._count,
        amount: fromMinorUnits(p._sum.amount ?? 0n, 'INR'),
      })),
      recentPayments: payments.map((p) => ({
        id: p.id,
        user: p.user,
        amount: fromMinorUnits(p.amount, p.currency),
        planTier: p.planTier,
        provider: p.provider,
        completedAt: p.completedAt,
      })),
    };
  }

  async listTickets(filters: AdminTicketFilterDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const where: Prisma.SupportTicketWhereInput = { deletedAt: null };
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, name: true } },
          messages: { orderBy: { createdAt: 'asc' }, take: 5 },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { tickets, total, page, limit };
  }

  async updateTicket(id: string, dto: AdminUpdateTicketDto, adminId: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id, deletedAt: null },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const data: Prisma.SupportTicketUpdateInput = { ...dto };
    if (dto.status === TicketStatus.RESOLVED || dto.status === TicketStatus.CLOSED) {
      data.resolvedAt = new Date();
    }

    const updated = await this.prisma.supportTicket.update({ where: { id }, data });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        userId: ticket.userId,
        action: 'ADMIN_UPDATE_TICKET',
        entity: 'SupportTicket',
        entityId: id,
        newValues: dto as Prisma.InputJsonValue,
      },
    });

    return updated;
  }

  async replyToTicket(id: string, adminId: string, dto: AdminTicketReplyDto) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id, deletedAt: null },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const [message] = await this.prisma.$transaction([
      this.prisma.ticketMessage.create({
        data: { ticketId: id, senderId: adminId, isStaff: true, message: dto.message },
      }),
      this.prisma.supportTicket.update({
        where: { id },
        data: { status: TicketStatus.IN_PROGRESS, assignedTo: adminId },
      }),
    ]);

    return message;
  }

  async listNotifications(page = 1, limit = 50, type?: string) {
    const where: Prisma.NotificationWhereInput = {};
    if (type) where.type = type as Prisma.EnumNotificationTypeFilter['equals'];

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: { user: { select: { id: true, email: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { notifications, total, page, limit };
  }

  async broadcastNotification(dto: AdminBroadcastNotificationDto, adminId: string) {
    const users = dto.userIds?.length
      ? await this.prisma.user.findMany({
          where: { id: { in: dto.userIds }, deletedAt: null },
          select: { id: true },
        })
      : await this.prisma.user.findMany({
          where: { deletedAt: null },
          select: { id: true },
        });

    const sent = [];
    for (const user of users) {
      const notification = await this.prisma.notification.create({
        data: {
          userId: user.id,
          type: dto.type,
          channel: dto.channel,
          title: dto.title,
          body: dto.body,
          data: { source: 'admin_broadcast', adminId },
          sentAt: new Date(),
        },
      });
      sent.push(notification);
    }

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'ADMIN_BROADCAST',
        entity: 'Notification',
        newValues: {
          title: dto.title,
          recipientCount: sent.length,
        } as Prisma.InputJsonValue,
      },
    });

    return { sent: sent.length, notifications: sent.slice(0, 10) };
  }

  private async estimateMrr(): Promise<bigint> {
    const premiumUsers = await this.prisma.user.count({
      where: { planTier: 'PREMIUM', deletedAt: null },
    });
    const familyUsers = await this.prisma.user.count({
      where: { planTier: 'FAMILY', deletedAt: null },
    });
    const plans = await this.prisma.plan.findMany();
    const premiumPlan = plans.find((p) => p.tier === 'PREMIUM');
    const familyPlan = plans.find((p) => p.tier === 'FAMILY');

    const premiumMrr = BigInt(premiumUsers ?? 0) * (premiumPlan?.priceMonthly ?? 0n);
    const familyMrr = BigInt(familyUsers ?? 0) * (familyPlan?.priceMonthly ?? 0n);
    return premiumMrr + familyMrr;
  }

  private groupByDate(
    items: { date: Date; count: number }[],
    days: number,
  ): { date: string; count: number }[] {
    const map = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      map.set(d.toISOString().slice(0, 10), 0);
    }
    for (const item of items) {
      const key = item.date.toISOString().slice(0, 10);
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + item.count);
    }
    return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
  }

  private groupPaymentsByDate(
    payments: { amount: bigint; completedAt: Date | null }[],
    days: number,
  ): { date: string; amount: string }[] {
    const map = new Map<string, bigint>();
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      map.set(d.toISOString().slice(0, 10), 0n);
    }
    for (const p of payments) {
      if (!p.completedAt) continue;
      const key = p.completedAt.toISOString().slice(0, 10);
      if (map.has(key)) map.set(key, (map.get(key) ?? 0n) + p.amount);
    }
    return Array.from(map.entries()).map(([date, amount]) => ({
      date,
      amount: fromMinorUnits(amount, 'INR'),
    }));
  }
}
