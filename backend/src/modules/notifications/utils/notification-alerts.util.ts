import { ExpenseCategory } from '@prisma/client';

export const EMI_ALERT_DAYS = [7, 3, 1, 0] as const;
export const GOAL_MILESTONES = [25, 50, 80, 100] as const;

export type NotificationPrefKey = 'emiReminders' | 'goalProgress' | 'overspendingAlerts';

export function isPrefEnabled(
  prefs: Record<string, unknown>,
  key: NotificationPrefKey,
): boolean {
  return prefs[key] !== false;
}

export function buildEmiReminderBody(loanName: string, daysUntil: number): string {
  if (daysUntil === 0) return `Your EMI for ${loanName} is due today.`;
  if (daysUntil === 1) return `Your EMI for ${loanName} is due tomorrow.`;
  return `Your EMI for ${loanName} is due in ${daysUntil} days.`;
}

export function buildEmiReminderTitle(daysUntil: number): string {
  if (daysUntil === 0) return 'EMI Due Today';
  if (daysUntil === 1) return 'EMI Due Tomorrow';
  return 'EMI Reminder';
}

export function formatCategoryLabel(category: ExpenseCategory): string {
  return category
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

export function buildBudgetExceededBody(category: ExpenseCategory): string {
  const label = formatCategoryLabel(category);
  return `The limit for ${label} has been exceeded this month.`;
}

export function buildGoalProgressBody(goalName: string, milestone: number): string {
  return `You are ${milestone}% toward your ${goalName.toLowerCase()} goal.`;
}

export function getCategoryBudget(
  financialPreferences: Record<string, unknown> | null | undefined,
  category: ExpenseCategory,
  monthlySalaryMinor: bigint | null | undefined,
): bigint | null {
  const budgets = financialPreferences?.categoryBudgets as Record<string, string> | undefined;
  const configured = budgets?.[category];
  if (configured) {
    const parsed = parseFloat(configured);
    if (Number.isFinite(parsed) && parsed > 0) {
      return BigInt(Math.round(parsed * 100));
    }
  }

  if (category === ExpenseCategory.FOOD && monthlySalaryMinor && monthlySalaryMinor > 0n) {
    return (monthlySalaryMinor * 15n) / 100n;
  }

  return null;
}

export function getCurrentMonthRange(): { start: Date; end: Date; monthKey: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return { start, end, monthKey };
}
