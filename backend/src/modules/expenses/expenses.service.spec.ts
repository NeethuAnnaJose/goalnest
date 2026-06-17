import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('ExpensesService', () => {
  let service: ExpensesService;
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue({ currency: 'INR' }) },
    expense: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: NotificationsService,
          useValue: { checkBudgetAfterExpense: jest.fn().mockResolvedValue(null) },
        },
      ],
    }).compile();
    service = module.get(ExpensesService);
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({ currency: 'INR' });
  });

  it('creates expense with minor units', async () => {
    prisma.expense.create.mockResolvedValue({ id: 'e1', amount: 150000n });
    const result = await service.create('u1', {
      category: 'FOOD',
      amount: '1500',
      date: '2026-06-01',
    });
    expect(result.expense.amount).toBe(150000n);
  });

  it('imports CSV expenses', async () => {
    prisma.expense.create.mockImplementation((args) => Promise.resolve({ id: 'e', ...args.data }));
    const csv = 'category,amount,date,description\nFOOD,1500,2026-06-01,Lunch';
    const result = await service.importCsv('u1', { csv });
    expect(result.imported).toBe(1);
  });

  it('rejects invalid CSV headers', async () => {
    await expect(service.importCsv('u1', { csv: 'foo,bar\n1,2' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws NotFoundException for missing expense', async () => {
    prisma.expense.findFirst.mockResolvedValue(null);
    await expect(service.findOne('u1', 'x')).rejects.toThrow(NotFoundException);
  });
});
