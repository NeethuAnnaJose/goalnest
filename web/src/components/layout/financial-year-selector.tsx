'use client';

import { CalendarRange } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatFinancialYearRange } from '@/lib/financial-year';
import { useFinancialYear } from '@/providers/financial-year-provider';

export function FinancialYearSelector({ compact = false }: { compact?: boolean }) {
  const { financialYear, availableYears, setFinancialYear } = useFinancialYear();

  if (!financialYear) return null;

  return (
    <div className={compact ? 'px-3' : ''}>
      {!compact && (
        <p className="mb-1 px-1 text-xs text-muted-foreground">Financial year</p>
      )}
      <div className="relative">
        <CalendarRange className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Select
          value={financialYear}
          onValueChange={(fy) => setFinancialYear(fy, { skipRedirect: true })}
        >
          <SelectTrigger className="h-8 w-full pl-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((fy) => (
              <SelectItem key={fy.label} value={fy.label}>
                {formatFinancialYearRange(fy.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
