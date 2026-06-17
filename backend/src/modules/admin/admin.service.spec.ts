import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AdminService', () => {
  let service: AdminService;
  const prisma = {
    user: { count: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), groupBy: jest.fn() },
    supportTicket: { count: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    subscription: { count: jest.fn(), findMany: jest.fn() },
    payment: { findMany: jest.fn(), aggregate: jest.fn(), groupBy: jest.fn() },
    plan: { findMany: jest.fn() },
    expense: { aggregate: jest.fn() },
    analyticsEvent: { groupBy: jest.fn() },
    report: { count: jest.fn(), findMany: jest.fn() },
    aiInsight: { count: jest.fn() },
    notification: { findMany: jest.fn(), count: jest.fn(), create: jest.fn() },
    auditLog: { create: jest.fn() },
    ticketMessage: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(AdminService);
    jest.clearAllMocks();
  });

  it('returns overview stats', async () => {
    prisma.user.count
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(90)
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(5);
    prisma.supportTicket.count.mockResolvedValue(5);
    prisma.subscription.count.mockResolvedValue(40);
    prisma.payment.findMany.mockResolvedValue([{ amount: 49900n, currency: 'INR' }]);
    prisma.user.groupBy.mockResolvedValue([{ planTier: 'PREMIUM', _count: 20 }]);
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 150000n } });
    prisma.plan.findMany.mockResolvedValue([
      { tier: 'PREMIUM', priceMonthly: 49900n },
      { tier: 'FAMILY', priceMonthly: 79900n },
    ]);

    const result = await service.getOverview();
    expect(result.totalUsers).toBe(100);
    expect(result.activeUsers).toBe(90);
    expect(result.openTickets).toBe(5);
  });

  it('lists users with pagination', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'u1', email: 'a@test.com' }]);
    prisma.user.count.mockResolvedValue(1);

    const result = await service.listUsers({ page: 1, limit: 20 });
    expect(result.users).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('throws when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.getUser('x')).rejects.toThrow(NotFoundException);
  });

  it('broadcasts notifications', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);
    prisma.notification.create.mockImplementation((args) =>
      Promise.resolve({ id: 'n1', ...args.data }),
    );
    prisma.auditLog.create.mockResolvedValue({});

    const result = await service.broadcastNotification(
      {
        type: 'SYSTEM',
        channel: 'IN_APP',
        title: 'Maintenance',
        body: 'Scheduled downtime tonight',
      },
      'admin1',
    );
    expect(result.sent).toBe(2);
  });
});
