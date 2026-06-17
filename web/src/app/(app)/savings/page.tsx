'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PiggyBank, Plus, Trash2, TrendingUp, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/dashboard/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BulkSelectToolbar } from '@/components/ui/bulk-select-toolbar';
import { Checkbox } from '@/components/ui/checkbox';
import { useBulkDelete } from '@/hooks/use-bulk-delete';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { savingsApi } from '@/lib/api';
import { useFinancialYear } from '@/providers/financial-year-provider';
import { getErrorMessage } from '@/lib/api/client';
import { formatDayOfMonth } from '@/lib/format';
import { useConfirmDelete } from '@/hooks/use-confirm-delete';
import { EmptyState } from '@/components/ui/empty-state';
import { MonthlyContributionGrid } from '@/components/savings/monthly-contribution-grid';
import type { SavingsAccount } from '@/types/api';

const TYPES = [
  { value: 'BANK', label: 'Bank Account' },
  { value: 'CASH', label: 'Cash' },
  { value: 'FIXED_DEPOSIT', label: 'Fixed Deposit' },
  { value: 'RECURRING_DEPOSIT', label: 'Recurring Deposit' },
  { value: 'MUTUAL_FUNDS', label: 'Mutual Funds' },
  { value: 'OTHER', label: 'Other' },
];

function toMajor(amount: string | number) {
  return Number(amount) / 100;
}

function formatRupee(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function typeLabel(type: string, customName?: string) {
  if (type === 'OTHER' && customName) return customName;
  return TYPES.find((t) => t.value === type)?.label ?? type.replace(/_/g, ' ');
}

function showAccountName(acc: SavingsAccount) {
  return acc.type !== 'OTHER';
}

export default function SavingsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState('BANK');
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [depositAmounts, setDepositAmounts] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const { confirmDelete } = useConfirmDelete();
  const { financialYear, financialYearLabel, fyMonths, activeMonth, isReady } = useFinancialYear();
  const [monthlyDebitAmounts, setMonthlyDebitAmounts] = useState<Record<string, string>>({});
  const [debitDays, setDebitDays] = useState<Record<string, string>>({});
  const [togglingMonth, setTogglingMonth] = useState<string | null>(null);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['savings'],
    queryFn: () => savingsApi.list(),
  });

  const accountIds = useMemo(() => (accounts ?? []).map((a) => a.id), [accounts]);
  const accountSelection = useBulkSelection(accountIds);
  const { deleteSelected: deleteSelectedAccounts, deleting: bulkDeleting } = useBulkDelete({
    deleteFn: (id) => savingsApi.delete(id),
    itemLabel: 'accounts',
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (editingId && accountSelection.selectedIds.includes(editingId)) resetForm();
    },
  });

  const { data: growth, isLoading: growthLoading } = useQuery({
    queryKey: ['savings', 'growth', financialYear],
    queryFn: () => savingsApi.growth(financialYear!),
    enabled: isReady && !!financialYear,
  });

  const { data: contributions } = useQuery({
    queryKey: ['savings', 'contributions', financialYear],
    queryFn: () => savingsApi.contributions(financialYear!),
    enabled: isReady && !!financialYear,
  });

  const contributionsByAccount = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const c of contributions ?? []) {
      const months = map.get(c.savingsAccountId) ?? new Set<string>();
      months.add(c.month);
      map.set(c.savingsAccountId, months);
    }
    return map;
  }, [contributions]);

  const totalFromAccounts = useMemo(
    () => (accounts ?? []).reduce((sum, acc) => sum + toMajor(acc.balance), 0),
    [accounts],
  );

  const monthlySaved = Number(
    growth?.formatted?.monthlyContributions ?? growth?.formatted?.monthlySavingsGrowth ?? 0,
  );
  const yearlySaved = Number(
    growth?.formatted?.yearlyContributions ?? growth?.formatted?.yearlySavingsGrowth ?? 0,
  );
  const savedMonthsCount = growth?.savedMonthsCount ?? 0;
  const totalFyMonths = fyMonths.length;

  const isOtherType = type === 'OTHER';

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setBalance('');
    setType('BANK');
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (acc: SavingsAccount) => {
    setEditingId(acc.id);
    setShowForm(true);
    setType(acc.type);
    setName(acc.name);
    setBalance(String(toMajor(acc.balance)));
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { name: name.trim(), balance };
      return editingId
        ? savingsApi.update(editingId, payload)
        : savingsApi.create({ type, name: name.trim(), balance });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(editingId ? 'Account updated' : 'Account created');
      resetForm();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleSave = () => {
    if (isOtherType && !name.trim()) {
      toast.error('Please enter a name for this savings type');
      return;
    }
    if (!name.trim() || !balance) {
      toast.error('Please fill in all required fields');
      return;
    }
    saveMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => savingsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Account deleted');
      if (editingId) resetForm();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (await confirmDelete('this account')) deleteMutation.mutate(id);
  };

  const depositMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: string }) =>
      savingsApi.deposit(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Savings added to account');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleDeposit = (acc: SavingsAccount) => {
    const amount = depositAmounts[acc.id];
    if (!amount || Number(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    depositMutation.mutate(
      { id: acc.id, amount },
      {
        onSuccess: () => {
          setDepositAmounts((prev) => ({ ...prev, [acc.id]: '' }));
        },
      },
    );
  };

  const invalidateSavings = () => {
    queryClient.invalidateQueries({ queryKey: ['savings'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const monthlyDebitMutation = useMutation({
    mutationFn: ({ id, amount, day }: { id: string; amount: string; day?: number }) =>
      savingsApi.update(id, {
        monthlyDebitAmount: amount,
        ...(day ? { debitDayOfMonth: day } : {}),
      }),
    onSuccess: () => {
      invalidateSavings();
      toast.success('Monthly debit saved');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleSaveMonthlyDebit = (acc: SavingsAccount) => {
    const amount = monthlyDebitAmounts[acc.id] ?? getMonthlyDebitDisplay(acc);
    const dayStr = debitDays[acc.id] ?? getDebitDayDisplay(acc);
    if (!amount || Number(amount) <= 0) {
      toast.error('Enter a valid monthly debit amount');
      return;
    }
    const day = dayStr ? Number(dayStr) : undefined;
    if (day != null && (day < 1 || day > 28)) {
      toast.error('Debit day must be between 1 and 28');
      return;
    }
    monthlyDebitMutation.mutate({ id: acc.id, amount, day });
  };

  const contributionMutation = useMutation({
    mutationFn: ({
      id,
      month,
      checked,
      amount,
    }: {
      id: string;
      month: string;
      checked: boolean;
      amount?: string;
    }) => {
      setTogglingMonth(`${id}-${month}`);
      return checked
        ? savingsApi.recordContribution(id, month, amount)
        : savingsApi.removeContribution(id, month);
    },
    onSuccess: (_data, { checked }) => {
      invalidateSavings();
      queryClient.invalidateQueries({ queryKey: ['savings', 'growth'] });
      queryClient.invalidateQueries({ queryKey: ['savings', 'contributions'] });
      toast.success(checked ? 'Debit marked. Added to balance.' : 'Month unmarked');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
    onSettled: () => setTogglingMonth(null),
  });

  const handleMonthToggle = (acc: SavingsAccount, month: string, checked: boolean) => {
    const debitAmount =
      monthlyDebitAmounts[acc.id] ??
      (acc.monthlyDebitAmount != null ? String(toMajor(acc.monthlyDebitAmount)) : '');
    if (!debitAmount || Number(debitAmount) <= 0) {
      toast.error('Set a monthly debit amount first');
      return;
    }
    contributionMutation.mutate({ id: acc.id, month, checked, amount: debitAmount });
  };

  const getMonthlyDebitDisplay = (acc: SavingsAccount) => {
    if (acc.id in monthlyDebitAmounts) return monthlyDebitAmounts[acc.id];
    if (acc.monthlyDebitAmount != null) return String(toMajor(acc.monthlyDebitAmount));
    return '';
  };

  const getDebitDayDisplay = (acc: SavingsAccount) => {
    if (acc.id in debitDays) return debitDays[acc.id];
    if (acc.debitDayOfMonth != null) return String(acc.debitDayOfMonth);
    return '';
  };

  const getMonthlyDebitAmount = (acc: SavingsAccount) => {
    const raw = getMonthlyDebitDisplay(acc);
    return raw && Number(raw) > 0 ? Number(raw) : null;
  };

  const getDebitDay = (acc: SavingsAccount) => {
    const raw = getDebitDayDisplay(acc);
    return raw && Number(raw) > 0 ? Number(raw) : acc.debitDayOfMonth ?? null;
  };

  const formatMonthlyDebitSummary = (acc: SavingsAccount) => {
    const amount = getMonthlyDebitAmount(acc);
    if (!amount) return null;
    const day = getDebitDay(acc);
    return day
      ? `${formatRupee(amount)} deducted on ${formatDayOfMonth(day)} every month`
      : `${formatRupee(amount)} deducted every month`;
  };

  return (
    <>
      <Header title="Savings" description={financialYearLabel} />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {growthLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Total Savings"
              value={formatRupee(totalFromAccounts)}
              subtitle={`${accounts?.length ?? 0} account${(accounts?.length ?? 0) === 1 ? '' : 's'}`}
              icon={Wallet}
            />
            <StatCard
              title="Debited This Month"
              value={formatRupee(monthlySaved)}
              subtitle="From months you marked as deducted"
              icon={TrendingUp}
            />
            <StatCard
              title="Debited This FY"
              value={formatRupee(yearlySaved)}
              subtitle={`${savedMonthsCount} of ${totalFyMonths} months marked in ${financialYearLabel}`}
              icon={PiggyBank}
            />
          </div>
        )}

        <div className="flex justify-end">
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Account
          </Button>
        </div>

        {showForm && (
          <div className="rounded-lg border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">{editingId ? 'Edit account' : 'New savings account'}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              {!editingId && (
                <div className="min-w-[140px]">
                  <Label className="text-xs">Account Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="min-w-[140px] flex-1">
                <Label className="text-xs">
                  {isOtherType ? 'Savings Type Name' : 'Account Name'}
                </Label>
                <Input
                  className="h-8 mt-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    isOtherType
                      ? 'e.g. PPF, Gold, Chit Fund'
                      : type === 'MUTUAL_FUNDS'
                        ? 'HDFC Equity Fund'
                        : 'HDFC Savings'
                  }
                />
              </div>
              <div className="w-32">
                <Label className="text-xs">{editingId ? 'Current balance (₹)' : 'Already saved (₹)'}</Label>
                <Input className="h-8 mt-1" type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0" />
              </div>
              <Button
                size="sm"
                className="h-8"
                onClick={handleSave}
                disabled={!name.trim() || !balance || saveMutation.isPending}
              >
                {editingId ? 'Save' : 'Create'}
              </Button>
              {editingId && (
                <Button size="sm" variant="destructive" className="h-8" onClick={() => handleDelete(editingId)}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        )}

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium">Your accounts</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : (accounts ?? []).length === 0 ? (
              <EmptyState
                icon={PiggyBank}
                title="Add your first account"
                description="Add a bank account, FD, or other savings account."
              />
            ) : (
              <>
                <BulkSelectToolbar
                  totalCount={accountSelection.totalCount}
                  selectedCount={accountSelection.selectedCount}
                  allSelected={accountSelection.allSelected}
                  onToggleAll={accountSelection.toggleAll}
                  onDeleteSelected={() =>
                    deleteSelectedAccounts(accountSelection.selectedIds, accountSelection.clear)
                  }
                  deleting={bulkDeleting || deleteMutation.isPending}
                  itemLabel="accounts"
                />
                <div className="space-y-2">
                {(accounts ?? []).map((acc) => (
                  <div
                    key={acc.id}
                    className={`rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-muted/30 ${
                      accountSelection.isSelected(acc.id) ? 'border-primary/40 bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Checkbox
                        checked={accountSelection.isSelected(acc.id)}
                        onCheckedChange={() => accountSelection.toggle(acc.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => openEdit(acc)}>
                        <Badge
                          variant="secondary"
                          className={`mb-1 text-[10px] ${acc.type === 'OTHER' ? 'font-semibold' : ''}`}
                        >
                          {typeLabel(acc.type, acc.name)}
                        </Badge>
                        {showAccountName(acc) && (
                          <p className="font-semibold text-sm">{acc.name}</p>
                        )}
                        {acc.institution && (
                          <p className="text-xs text-muted-foreground">{acc.institution}</p>
                        )}
                        <p className="mt-1 text-lg font-bold tabular-nums">
                          {formatRupee(toMajor(acc.balance))}
                        </p>
                        {formatMonthlyDebitSummary(acc) && (
                          <p className="mt-0.5 text-[11px] font-medium text-primary">
                            {formatMonthlyDebitSummary(acc)}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        title="Delete account"
                        onClick={(e) => handleDelete(acc.id, e)}
                        disabled={deleteMutation.isPending || bulkDeleting}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="mt-2 space-y-2 border-t pt-2" onClick={(e) => e.stopPropagation()}>
                      <p className="text-[11px] text-muted-foreground">
                        How much is auto-debited from your account into this savings each month?
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          type="number"
                          className="h-7 w-28 text-xs"
                          placeholder="Amount ₹"
                          value={getMonthlyDebitDisplay(acc)}
                          onChange={(e) =>
                            setMonthlyDebitAmounts((prev) => ({ ...prev, [acc.id]: e.target.value }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveMonthlyDebit(acc)}
                        />
                        <Input
                          type="number"
                          min={1}
                          max={28}
                          className="h-7 w-20 text-xs"
                          placeholder="Day"
                          value={getDebitDayDisplay(acc)}
                          onChange={(e) =>
                            setDebitDays((prev) => ({ ...prev, [acc.id]: e.target.value }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveMonthlyDebit(acc)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleSaveMonthlyDebit(acc)}
                          disabled={monthlyDebitMutation.isPending}
                        >
                          Save
                        </Button>
                      </div>
                      <div>
                        <p className="mb-1.5 text-[11px] text-muted-foreground">
                          Tick when deducted. Green = saved, amber = not marked, blue ring = this month
                        </p>
                        <MonthlyContributionGrid
                          fyMonths={fyMonths}
                          activeMonth={activeMonth}
                          savedMonths={contributionsByAccount.get(acc.id) ?? new Set()}
                          monthlyAmount={getMonthlyDebitAmount(acc)}
                          debitDayOfMonth={getDebitDay(acc)}
                          onToggle={(month, checked) => handleMonthToggle(acc, month, checked)}
                          disabled={contributionMutation.isPending}
                          togglingMonth={
                            togglingMonth?.startsWith(`${acc.id}-`)
                              ? togglingMonth.slice(acc.id.length + 1)
                              : null
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="h-7 w-28 text-xs"
                          placeholder="Add savings ₹"
                          value={depositAmounts[acc.id] ?? ''}
                          onChange={(e) =>
                            setDepositAmounts((prev) => ({ ...prev, [acc.id]: e.target.value }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && handleDeposit(acc)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleDeposit(acc)}
                          disabled={depositMutation.isPending}
                        >
                          Add to balance
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
