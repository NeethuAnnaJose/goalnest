'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MonthlyEmiGrid } from '@/components/loans/monthly-emi-grid';
import { emisApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/api/client';
import { formatDate, formatMoney } from '@/lib/format';

function monthKeyFromDate(dateStr: string) {
  const d = new Date(dateStr);
  // Use UTC so due dates align with the month stored on the server
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

interface LoanEmiTrackerProps {
  loanId: string;
  fyMonths: string[];
  activeMonth: string;
  financialYear: string;
}

export function LoanEmiTracker({ loanId, fyMonths, activeMonth, financialYear }: LoanEmiTrackerProps) {
  const queryClient = useQueryClient();
  const [togglingMonth, setTogglingMonth] = useState<string | null>(null);

  const { data: tracker, isLoading } = useQuery({
    queryKey: ['emis', 'tracker', loanId],
    queryFn: () => emisApi.tracker(loanId),
  });

  const emiByMonth = useMemo(() => {
    const map = new Map<string, { id: string; status: string; dueDate: string; amountMajor: number }>();
    for (const emi of tracker?.emis ?? []) {
      const key = monthKeyFromDate(emi.dueDate);
      if (fyMonths.includes(key)) {
        const amountMajor =
          emi.amountMajor != null ? Number(emi.amountMajor) : Number(emi.amount) / 100;
        map.set(key, { id: emi.id, status: emi.status, dueDate: emi.dueDate, amountMajor });
      }
    }
    return map;
  }, [tracker, fyMonths]);

  const nextDueEmi = useMemo(() => {
    const now = Date.now();
    return (tracker?.emis ?? [])
      .filter((e) => e.status === 'PENDING' || e.status === 'MISSED')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .find((e) => new Date(e.dueDate).getTime() >= now - 86400000 * 31)
      ?? (tracker?.emis ?? []).find((e) => e.status === 'PENDING' || e.status === 'MISSED');
  }, [tracker]);

  const paidInFy = useMemo(
    () => Array.from(emiByMonth.values()).filter((e) => e.status === 'PAID').length,
    [emiByMonth],
  );

  const emiMutation = useMutation({
    mutationFn: ({ emiId, month, checked }: { emiId: string; month: string; checked: boolean }) => {
      setTogglingMonth(month);
      return checked
        ? emisApi.pay(emiId, new Date().toISOString().split('T')[0])
        : emisApi.unpay(emiId);
    },
    onSuccess: (_data, { checked }) => {
      queryClient.invalidateQueries({ queryKey: ['emis', 'tracker', loanId] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans', 'upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['loans', 'summary', financialYear] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(checked ? 'EMI marked as paid' : 'EMI payment undone');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
    onSettled: () => setTogglingMonth(null),
  });

  const handleToggle = (month: string, checked: boolean) => {
    const emi = emiByMonth.get(month);
    if (!emi) {
      toast.error('No EMI due this month for this loan');
      return;
    }
    emiMutation.mutate({ emiId: emi.id, month, checked });
  };

  if (isLoading) {
    return <p className="text-xs text-muted-foreground py-2">Loading EMI schedule…</p>;
  }

  return (
    <div className="mt-2 space-y-1.5 border-t pt-2" onClick={(e) => e.stopPropagation()}>
      {nextDueEmi && (
        <p className="text-xs font-medium text-primary">
          Next due: {formatDate(nextDueEmi.dueDate)} ·{' '}
          {formatMoney(nextDueEmi.amountMajor ?? Number(nextDueEmi.amount) / 100)}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">
        Tick when EMI is paid. Green = paid, amber = overdue, blue ring = due this month, red = missed (
        {paidInFy}/{emiByMonth.size} this FY)
      </p>
      <MonthlyEmiGrid
        fyMonths={fyMonths}
        activeMonth={activeMonth}
        emiByMonth={emiByMonth}
        onToggle={handleToggle}
        disabled={emiMutation.isPending}
        togglingMonth={togglingMonth}
      />
    </div>
  );
}
