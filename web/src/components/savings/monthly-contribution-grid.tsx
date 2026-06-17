'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { formatCompactMoney, formatDayOfMonth } from '@/lib/format';
import { cn } from '@/lib/utils';

function shortMonthLabel(month: string) {
  const [, m] = month.split('-').map(Number);
  return new Date(2000, m - 1, 1).toLocaleDateString('en-IN', { month: 'short' });
}

interface MonthlyContributionGridProps {
  fyMonths: string[];
  activeMonth: string;
  savedMonths: Set<string>;
  monthlyAmount?: number | null;
  debitDayOfMonth?: number | null;
  onToggle: (month: string, checked: boolean) => void;
  disabled?: boolean;
  togglingMonth?: string | null;
}

export function MonthlyContributionGrid({
  fyMonths,
  activeMonth,
  savedMonths,
  monthlyAmount,
  debitDayOfMonth,
  onToggle,
  disabled,
  togglingMonth,
}: MonthlyContributionGridProps) {
  const hasMonthlyDebit = monthlyAmount != null && monthlyAmount > 0;

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-12">
      {fyMonths.map((month) => {
        const isSaved = savedMonths.has(month);
        const isFuture = month > activeMonth;
        const isThisMonth = hasMonthlyDebit && !isSaved && !isFuture && month === activeMonth;
        const isCurrent = month === activeMonth;
        const isToggling = togglingMonth === month;
        const canToggle = hasMonthlyDebit && !disabled && !isFuture && !isToggling;

        return (
          <label
            key={month}
            title={
              hasMonthlyDebit
                ? `${debitDayOfMonth ? `Debited on ${formatDayOfMonth(debitDayOfMonth)}` : 'Debited this month'} · ${formatCompactMoney(monthlyAmount!)}`
                : 'Set how much is deducted each month first'
            }
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-md border px-1 py-1.5 text-center transition-colors min-h-[52px]',
              !hasMonthlyDebit && 'border-dashed opacity-30',
              isSaved && 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30',
              hasMonthlyDebit && !isSaved && !isFuture && !isThisMonth && 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20',
              isThisMonth && 'border-primary/50 bg-primary/5',
              isFuture && hasMonthlyDebit && 'opacity-40',
              isCurrent && hasMonthlyDebit && 'ring-1 ring-primary/40',
              canToggle ? 'cursor-pointer hover:border-primary/50' : 'cursor-not-allowed',
            )}
          >
            <Checkbox
              checked={isSaved}
              disabled={!canToggle}
              onCheckedChange={(checked) => onToggle(month, checked === true)}
              onClick={(e) => e.stopPropagation()}
              className="h-3.5 w-3.5"
            />
            <span className="text-[10px] font-medium leading-none">{shortMonthLabel(month)}</span>
            {hasMonthlyDebit && debitDayOfMonth && (
              <span className="text-[9px] leading-tight text-muted-foreground">
                {formatDayOfMonth(debitDayOfMonth)}
              </span>
            )}
            {hasMonthlyDebit && (
              <span className="text-[9px] font-medium leading-tight tabular-nums">
                {formatCompactMoney(monthlyAmount!)}
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}
