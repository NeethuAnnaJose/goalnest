import { ExpenseCategory } from '@prisma/client';
import {
  buildBudgetExceededBody,
  buildEmiReminderBody,
  buildGoalProgressBody,
  getCategoryBudget,
} from './notification-alerts.util';

describe('notification-alerts.util', () => {
  it('builds EMI reminder for 3 days', () => {
    expect(buildEmiReminderBody('Home Loan', 3)).toBe('Your EMI for Home Loan is due in 3 days.');
  });

  it('builds food budget exceeded message', () => {
    expect(buildBudgetExceededBody(ExpenseCategory.FOOD)).toBe(
      'The limit for Food has been exceeded this month.',
    );
  });

  it('builds house goal progress message', () => {
    expect(buildGoalProgressBody('house', 80)).toBe('You are 80% toward your house goal.');
  });

  it('reads configured category budget', () => {
    const budget = getCategoryBudget({ categoryBudgets: { FOOD: '5000' } }, ExpenseCategory.FOOD, null);
    expect(budget).toBe(500000n);
  });

  it('defaults food budget to 15% of salary', () => {
    const budget = getCategoryBudget({}, ExpenseCategory.FOOD, 10000000n);
    expect(budget).toBe(1500000n);
  });
});
