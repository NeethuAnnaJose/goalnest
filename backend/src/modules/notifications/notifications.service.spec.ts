import { Test, TestingModule } from '@nestjs/testing';

import { NotFoundException } from '@nestjs/common';

import { NotificationsService } from './notifications.service';

import { PrismaService } from '../../prisma/prisma.service';

import { EmiPaymentStatus, ExpenseCategory, GoalType } from '@prisma/client';



describe('NotificationsService', () => {

  let service: NotificationsService;

  const prisma = {

    notification: {

      create: jest.fn(),

      findMany: jest.fn(),

      findFirst: jest.fn(),

      update: jest.fn(),

      updateMany: jest.fn(),

      count: jest.fn(),

    },

    userProfile: { findUnique: jest.fn(), upsert: jest.fn() },

    emiPayment: { findMany: jest.fn().mockResolvedValue([]) },

    device: { findMany: jest.fn().mockResolvedValue([]) },

    user: { findMany: jest.fn(), findUnique: jest.fn() },

    expense: { findMany: jest.fn() },

    goal: { findMany: jest.fn(), findFirst: jest.fn() },

  };



  beforeEach(async () => {

    const module: TestingModule = await Test.createTestingModule({

      providers: [NotificationsService, { provide: PrismaService, useValue: prisma }],

    }).compile();

    service = module.get(NotificationsService);

    jest.clearAllMocks();

    prisma.userProfile.findUnique.mockResolvedValue({ notificationPrefs: {} });

    prisma.notification.findFirst.mockResolvedValue(null);

    prisma.notification.create.mockImplementation((args) =>

      Promise.resolve({ id: 'n1', ...args.data }),

    );

  });



  it('creates and dispatches notification', async () => {

    const result = await service.create('u1', {

      type: 'GOAL_PROGRESS',

      channel: 'IN_APP',

      title: 'Goal Update',

      body: 'You reached 50%',

    });

    expect(result.id).toBe('n1');

  });



  it('returns unread count', async () => {

    prisma.notification.count.mockResolvedValue(5);

    const result = await service.getUnreadCount('u1');

    expect(result.count).toBe(5);

  });



  it('throws NotFoundException when marking unknown notification', async () => {

    prisma.notification.findFirst.mockResolvedValue(null);

    await expect(service.markRead('u1', 'x')).rejects.toThrow(NotFoundException);

  });



  it('sends EMI due in 3 days notification', async () => {
    let emiCall = 0;
    prisma.emiPayment.findMany.mockImplementation(() => {
      emiCall++;
      if (emiCall === 2) {
        return Promise.resolve([
          {
            id: 'emi1',
            loanId: 'loan1',
            amount: 2500000n,
            loan: { name: 'Home Loan' },
          },
        ]);
      }
      return Promise.resolve([]);
    });

    const sent = await service.sendEmiReminders('u1');
    expect(sent).toHaveLength(1);
    expect(sent[0].body).toBe('Your EMI for Home Loan is due in 3 days.');
    expect(sent[0].type).toBe('EMI_REMINDER');
  });



  it('sends food budget exceeded notification', async () => {

    prisma.user.findUnique.mockResolvedValue({

      financialPreferences: { categoryBudgets: { FOOD: '5000' } },

      monthlySalary: 10000000n,

    });

    prisma.expense.findMany.mockImplementation(({ where }) => {

      if (where.category === ExpenseCategory.FOOD) {

        return Promise.resolve([{ amount: 600000n }, { amount: 100000n }]);

      }

      return Promise.resolve([]);

    });



    const sent = await service.sendOverspendingAlerts('u1');

    expect(sent).toHaveLength(1);

    expect(sent[0].body).toBe('You exceeded your food budget this month.');

    expect(sent[0].type).toBe('OVERSPENDING');

  });



  it('sends 80% house goal notification', async () => {

    prisma.goal.findMany.mockResolvedValue([

      {

        id: 'g1',

        type: GoalType.HOUSE,

        name: 'Dream Home',

        targetAmount: 100000000n,

        currentSavings: 80000000n,

        isCompleted: false,

      },

    ]);



    const sent = await service.sendGoalProgressAlerts('u1');

    const milestone80 = sent.find(
      (n) => (n.data as Record<string, unknown>)?.milestone === 80,
    );

    expect(milestone80).toBeDefined();

    expect(milestone80?.body).toBe('You are 80% toward your house goal.');

  });



  it('skips duplicate notifications', async () => {

    prisma.emiPayment.findMany.mockResolvedValue([

      { id: 'emi1', loanId: 'loan1', amount: 1000n, loan: { name: 'Loan' } },

    ]);

    prisma.notification.findFirst.mockResolvedValue({ id: 'existing' });



    const sent = await service.sendEmiReminders('u1');

    expect(sent).toHaveLength(0);

  });



  it('respects disabled EMI reminder preference', async () => {

    prisma.userProfile.findUnique.mockResolvedValue({ notificationPrefs: { emiReminders: false } });

    const sent = await service.sendEmiReminders('u1');

    expect(sent).toHaveLength(0);

    expect(prisma.emiPayment.findMany).not.toHaveBeenCalled();

  });

});


