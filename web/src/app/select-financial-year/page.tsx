'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarRange } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatFinancialYearRange } from '@/lib/financial-year';
import { useAuth } from '@/providers/auth-provider';
import { useFinancialYear } from '@/providers/financial-year-provider';

export default function SelectFinancialYearPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { availableYears, financialYear, setFinancialYear } = useFinancialYear();
  const [selected, setSelected] = useState(financialYear ?? availableYears[0]?.label ?? '');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (financialYear) setSelected(financialYear);
  }, [financialYear]);

  if (!isLoading && !isAuthenticated) {
    router.replace('/login');
    return null;
  }

  const handleContinue = async () => {
    if (!selected) {
      toast.error('Please select a financial year');
      return;
    }
    setLoading(true);
    try {
      await setFinancialYear(selected);
      toast.success('Financial year set');
    } catch {
      toast.error('Could not save financial year');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Choose your financial year"
      subtitle="Income, expenses, and reports will use this period"
    >
      <div className="flex justify-center">
        <div className="rounded-full bg-primary/10 p-4">
          <CalendarRange className="h-8 w-8 text-primary" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fy">Financial year</Label>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger id="fy">
              <SelectValue placeholder="Select financial year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((fy) => (
                <SelectItem key={fy.label} value={fy.label}>
                  {formatFinancialYearRange(fy.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selected && (
            <p className="text-sm text-muted-foreground">
              Viewing data from {formatFinancialYearRange(selected)} (Indian FY: April to March)
            </p>
          )}
        </div>

        <Button type="button" className="w-full" disabled={loading || !selected} onClick={handleContinue}>
          {loading ? 'Saving...' : 'Continue to dashboard'}
        </Button>
      </div>
    </AuthLayout>
  );
}
