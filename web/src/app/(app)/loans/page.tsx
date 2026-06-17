'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, Landmark, Plus, Trash2, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/dashboard/stat-card';
import { LoanEmiTracker } from '@/components/loans/loan-emi-tracker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { emisApi, loansApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/api/client';
import { useFinancialYear } from '@/providers/financial-year-provider';
import { useConfirmDelete } from '@/hooks/use-confirm-delete';
import { EmptyState } from '@/components/ui/empty-state';
import { BulkSelectToolbar } from '@/components/ui/bulk-select-toolbar';
import { Checkbox } from '@/components/ui/checkbox';
import { useBulkDelete } from '@/hooks/use-bulk-delete';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { formatDate } from '@/lib/format';
import type { Loan } from '@/types/api';

const LOAN_TYPES = ['HOME', 'PERSONAL', 'VEHICLE', 'EDUCATION', 'CREDIT_CARD'];

function toMajor(amount: string | number) {
  return Number(amount) / 100;
}

function formatLoanType(type: string) {
  return type.replace(/_/g, ' ');
}

function formatRupee(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function LoansPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState('HOME');
  const [name, setName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('8.5');
  const [tenureMonths, setTenureMonths] = useState('240');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const queryClient = useQueryClient();
  const { confirmDelete } = useConfirmDelete();
  const { financialYear, financialYearLabel, fyMonths, activeMonth, isReady } = useFinancialYear();

  const { data: loans } = useQuery({ queryKey: ['loans'], queryFn: () => loansApi.list() });
  const { data: upcomingEmis } = useQuery({ queryKey: ['loans', 'upcoming'], queryFn: () => loansApi.upcomingEmis() });
  const { data: emiSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['loans', 'summary', financialYear],
    queryFn: () => emisApi.summary(financialYear!),
    enabled: isReady && !!financialYear,
  });

  const totalOutstanding = useMemo(
    () => (loans ?? []).reduce((sum, loan) => sum + toMajor(loan.remainingBalance), 0),
    [loans],
  );
  const paidThisMonth = Number(emiSummary?.formatted?.monthlyPaidTotal ?? 0);
  const paidThisFy = Number(emiSummary?.formatted?.yearlyPaidTotal ?? 0);
  const paidMonthsCount = emiSummary?.paidMonthsCount ?? 0;
  const emisDueInFy = emiSummary?.emisDueInFy ?? 0;

  const loanIds = useMemo(() => (loans ?? []).map((l) => l.id), [loans]);
  const loanSelection = useBulkSelection(loanIds);
  const { deleteSelected: deleteSelectedLoans, deleting: bulkDeleting } = useBulkDelete({
    deleteFn: (id) => loansApi.delete(id),
    itemLabel: 'loans',
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (editingId && loanSelection.selectedIds.includes(editingId)) resetForm();
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setType('HOME');
    setName('');
    setPrincipal('');
    setInterestRate('8.5');
    setTenureMonths('240');
    setStartDate(new Date().toISOString().split('T')[0]);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (loan: Loan) => {
    setEditingId(loan.id);
    setShowForm(true);
    setType(loan.type);
    setName(loan.name);
    setPrincipal(String(toMajor(loan.principal)));
    setInterestRate(String(loan.interestRate));
    setTenureMonths(String(loan.tenureMonths));
    setStartDate(loan.startDate ? loan.startDate.split('T')[0] : new Date().toISOString().split('T')[0]);
  };

  const createMutation = useMutation({
    mutationFn: () =>
      loansApi.create({ type, name, principal, interestRate, tenureMonths: Number(tenureMonths), startDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Loan created with EMI schedule');
      resetForm();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      loansApi.update(editingId!, {
        type,
        name,
        principal,
        interestRate,
        tenureMonths: Number(tenureMonths),
        startDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Loan updated');
      resetForm();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => loansApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Loan deleted');
      if (editingId) resetForm();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleSubmit = () => {
    if (!name || !principal) {
      toast.error('Please fill in required fields');
      return;
    }
    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (await confirmDelete('this loan and its EMI schedule')) {
      deleteMutation.mutate(id);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Header title="Loans & EMIs" description={financialYearLabel} />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {summaryLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Total Outstanding"
              value={formatRupee(totalOutstanding)}
              subtitle={`${loans?.length ?? 0} loan${(loans?.length ?? 0) === 1 ? '' : 's'}`}
              icon={Wallet}
            />
            <StatCard
              title="Paid This Month"
              value={formatRupee(paidThisMonth)}
              subtitle="EMIs marked as paid this month"
              icon={CalendarCheck}
            />
            <StatCard
              title="Paid This FY"
              value={formatRupee(paidThisFy)}
              subtitle={`${paidMonthsCount} of ${emisDueInFy} EMIs paid in ${financialYearLabel}`}
              icon={Landmark}
            />
          </div>
        )}

        <div className="flex justify-end">
          <Button size="sm" onClick={openCreateForm}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Loan
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {editingId ? 'Edit loan' : 'New loan'}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LOAN_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{formatLoanType(t)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input className="h-8" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Principal (₹)</Label>
                  <Input className="h-8" type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Interest Rate (%)</Label>
                  <Input className="h-8" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tenure (months)</Label>
                  <Input className="h-8" type="number" value={tenureMonths} onChange={(e) => setTenureMonths(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Start Date</Label>
                  <Input className="h-8" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={handleSubmit} disabled={isSaving}>
                  {editingId ? 'Save changes' : 'Create loan'}
                </Button>
                {editingId && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(editingId)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete loan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-sm font-medium">Your loans</h2>
            {(loans ?? []).length === 0 ? (
              <EmptyState
                icon={Landmark}
                title="No loans to track"
                description="Add a loan to track EMIs and payment schedule."
              />
            ) : (
              <>
                <BulkSelectToolbar
                  totalCount={loanSelection.totalCount}
                  selectedCount={loanSelection.selectedCount}
                  allSelected={loanSelection.allSelected}
                  onToggleAll={loanSelection.toggleAll}
                  onDeleteSelected={() =>
                    deleteSelectedLoans(loanSelection.selectedIds, loanSelection.clear)
                  }
                  deleting={bulkDeleting || deleteMutation.isPending}
                  itemLabel="loans"
                />
                {(loans ?? []).map((loan) => (
                <Card
                  key={loan.id}
                  className={`transition-colors hover:border-primary/40 hover:bg-muted/30 ${
                    loanSelection.isSelected(loan.id) ? 'border-primary/40 bg-primary/5' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox
                          checked={loanSelection.isSelected(loan.id)}
                          onCheckedChange={() => loanSelection.toggle(loan.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                          onClick={() => openEditForm(loan)}
                        >
                          <Landmark className="h-5 w-5 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{loan.name}</p>
                            <Badge variant="secondary" className="text-[10px]">{formatLoanType(loan.type)}</Badge>
                            <p className="mt-1 text-xs text-muted-foreground">
                              EMI due: ₹{loan.emiAmountMajor ?? toMajor(loan.emiAmount).toLocaleString()}/mo
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">Remaining</p>
                          <p className="font-bold text-sm">₹{toMajor(loan.remainingBalance).toLocaleString()}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Delete loan"
                          onClick={(e) => handleDelete(loan.id, e)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {financialYear && (
                      <LoanEmiTracker
                        loanId={loan.id}
                        fyMonths={fyMonths}
                        activeMonth={activeMonth}
                        financialYear={financialYear}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
              </>
            )}
          </div>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium">Upcoming EMIs</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-2">
              {(upcomingEmis ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No upcoming EMIs.</p>
              ) : (
                (upcomingEmis ?? []).map((emi) => (
                  <div key={emi.id} className="flex justify-between items-center rounded-lg border p-3 text-sm">
                    <div>
                      <p className="font-medium">{emi.loan?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Due {formatDate(emi.dueDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1 text-[10px] text-primary border-primary/40">
                        Due
                      </Badge>
                      <p className="font-semibold tabular-nums">
                        ₹{emi.amountMajor ?? toMajor(emi.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
