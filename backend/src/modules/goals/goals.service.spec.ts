import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('GoalsService', () => {
  let service: GoalsService;
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue({ currency: 'INR' }) },
    goal: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: NotificationsService,
          useValue: { checkGoalAfterProgress: jest.fn().mockResolvedValue(null) },
        },
      ],
    }).compile();
    service = module.get(GoalsService);
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({ currency: 'INR' });
  });

  it('creates goal with target in minor units', async () => {
    prisma.goal.create.mockResolvedValue({
      id: 'g1',
      targetAmount: 50000000n,
      currentSavings: 0n,
      currency: 'INR',
      isCompleted: false,
      type: 'HOUSE',
      name: 'Dream Home',
      targetDate: null,
      priority: 1,
      notes: null,
      createdAt: new Date(),
    });
    const result = await service.create('u1', {
      type: 'HOUSE',
      name: 'Dream Home',
      targetAmount: '500000',
    });
    expect(result.targetAmount).toBe(50000000n);
  });

  it('enriches goal with completion percent', async () => {
    prisma.goal.findMany.mockResolvedValue([
      {
        id: 'g1',
        name: 'Car',
        targetAmount: 10000000n,
        currentSavings: 5000000n,
        targetDate: new Date('2027-01-01'),
        currency: 'INR',
        isCompleted: false,
        type: 'CAR',
        priority: 1,
        notes: null,
        createdAt: new Date(),
      },
    ]);
    const result = await service.findAll('u1');
    expect(result[0].completionPercent).toBe(50);
  });

  it('throws NotFoundException for missing goal', async () => {
    prisma.goal.findFirst.mockResolvedValue(null);
    await expect(service.findOne('u1', 'x')).rejects.toThrow(NotFoundException);
  });
});
