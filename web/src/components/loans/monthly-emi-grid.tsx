'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { formatCompactMoney, formatDueShort } from '@/lib/format';
import { cn } from '@/lib/utils';

function shortMonthLabel(month: string) {
  const [, m] = month.split('-').map(Number);
  return new Date(2000, m - 1, 1).toLocaleDateString('en-IN', { month: 'short' });
}

export interface EmiMonthInfo {
  id: string;
  status: string;
  dueDate: string;
  amountMajor: number;
}

interface MonthlyEmiGridProps {
  fyMonths: string[];
  activeMonth: string;
  emiByMonth: Map<string, EmiMonthInfo>;
  onToggle: (month: string, checked: boolean) => void;
  disabled?: boolean;
  togglingMonth?: string | null;
}

export function MonthlyEmiGrid({
  fyMonths,
  activeMonth,
  emiByMonth,
  onToggle,
  disabled,
  togglingMonth,
}: MonthlyEmiGridProps) {
  return (
    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-12">
      {fyMonths.map((month) => {
        const emi = emiByMonth.get(month);
        const isPaid = emi?.status === 'PAID';
        const isMissed = emi?.status === 'MISSED';
        const isOverdue = !!emi && !isPaid && !isMissed && month < activeMonth;
        const isDue = !!emi && !isPaid && !isMissed && month === activeMonth;
        const isCurrent = month === activeMonth;
        const isToggling = togglingMonth === month;
        const hasEmi = !!emi;
        const canToggle = hasEmi && !disabled && !isToggling;

        return (
          <label
            key={month}
            title={hasEmi ? `Due ${formatDueShort(emi.dueDate)} · ${formatCompactMoney(emi.amountMajor)}` : undefined}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-md border px-1 py-1.5 text-center transition-colors min-h-[52px]',
              !hasEmi && 'border-dashed opacity-30',
              hasEmi && isPaid && 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30',
              hasEmi && isMissed && 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30',
              isOverdue && 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20',
              isDue && 'border-primary/50 bg-primary/5',
              isCurrent && hasEmi && !isPaid && 'ring-1 ring-primary/40',
              canToggle ? 'cursor-pointer hover:border-primary/50' : 'cursor-not-allowed',
            )}
          >
            <Checkbox
              checked={isPaid}
              disabled={!canToggle}
              onCheckedChange={(checked) => onToggle(month, checked === true)}
              onClick={(e) => e.stopPropagation()}
              className="h-3.5 w-3.5"
            />
            <span className="text-[10px] font-medium leading-none">{shortMonthLabel(month)}</span>
            {hasEmi && (
              <span className="text-[9px] leading-tight text-muted-foreground">
                Due {formatDueShort(emi.dueDate)}
              </span>
            )}
            {hasEmi && (
              <span className="text-[9px] font-medium leading-tight tabular-nums">
                {formatCompactMoney(emi.amountMajor)}
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}
