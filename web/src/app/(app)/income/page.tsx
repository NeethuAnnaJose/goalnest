'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUpCircle, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BulkSelectToolbar } from '@/components/ui/bulk-select-toolbar';
import { EditableListRow } from '@/components/ui/editable-list-row';
import { useBulkDelete } from '@/hooks/use-bulk-delete';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { EmptyState } from '@/components/ui/empty-state';
import { incomeApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/api/client';
import { useConfirmDelete } from '@/hooks/use-confirm-delete';
import { formatDate } from '@/lib/format';
import { formatMonthLabel } from '@/lib/financial-year';
import { useFinancialYear } from '@/providers/financial-year-provider';
import type { Income } from '@/types/api';

const INCOME_TYPES = ['SALARY', 'FREELANCE', 'RENTAL', 'BUSINESS', 'OTHER'];

function formatType(type: string) {
  return type.replace(/_/g, ' ');
}

export default function IncomePage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState('SALARY');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const { financialYear, financialYearLabel, activeMonth, fyMonths, isReady } = useFinancialYear();
  const [month, setMonth] = useState(activeMonth);
  const queryClient = useQueryClient();
  const { confirmDelete } = useConfirmDelete();

  useEffect(() => {
    setMonth(activeMonth);
  }, [activeMonth, financialYear]);

  const { data: incomes, isLoading } = useQuery({
    queryKey: ['income', financialYear, month],
    queryFn: () => incomeApi.list({ month }),
    enabled: isReady && !!financialYear,
  });

  const incomeIds = useMemo(() => (incomes ?? []).map((i) => i.id), [incomes]);
  const incomeSelection = useBulkSelection(incomeIds);
  const { deleteSelected: deleteSelectedIncome, deleting: bulkDeleting } = useBulkDelete({
    deleteFn: (id) => incomeApi.delete(id),
    itemLabel: 'income entries',
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (editingId && incomeSelection.selectedIds.includes(editingId)) resetForm();
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setType('SALARY');
    setAmount('');
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (inc: Income) => {
    setEditingId(inc.id);
    setShowForm(true);
    setType(inc.type);
    setAmount(String(Number(inc.amount) / 100));
    setDate(inc.date.split('T')[0]);
    setNotes(inc.notes || inc.category || '');
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        type,
        amount,
        date,
        notes: notes || undefined,
        isRecurring: type === 'SALARY',
        frequency: type === 'SALARY' ? 'MONTHLY' : undefined,
      };
      return editingId
        ? incomeApi.update(editingId, payload)
        : incomeApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(editingId ? 'Income updated' : 'Income added');
      resetForm();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => incomeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Income deleted');
      if (editingId) resetForm();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleDelete = async (id: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (await confirmDelete(label)) deleteMutation.mutate(id);
  };

  const monthlyTotal = (incomes ?? []).reduce((sum, inc) => sum + Number(inc.amount), 0);

  return (
    <>
      <Header title="Salary" description={financialYearLabel} />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Month</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fyMonths.map((m) => (
                  <SelectItem key={m} value={m}>{formatMonthLabel(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isLoading && (incomes ?? []).length > 0 && (
              <p className="text-sm text-muted-foreground">
                Total: <span className="font-semibold text-foreground">₹{(monthlyTotal / 100).toLocaleString()}</span>
              </p>
            )}
          </div>
          <Button size="sm" className="ml-auto" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Income
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">{editingId ? 'Edit income' : 'New income'}</CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[120px]">
                  <Label className="text-xs">Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INCOME_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{formatType(t)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-28">
                  <Label className="text-xs">Amount (₹)</Label>
                  <Input className="h-8 mt-1" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="w-36">
                  <Label className="text-xs">Date</Label>
                  <Input className="h-8 mt-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="min-w-[120px] flex-1">
                  <Label className="text-xs">Notes</Label>
                  <Input className="h-8 mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <Button size="sm" className="h-8" onClick={() => saveMutation.mutate()} disabled={!amount || saveMutation.isPending}>
                  {editingId ? 'Save' : 'Add'}
                </Button>
                {editingId && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8"
                    onClick={async () => {
                      if (await confirmDelete('this income')) deleteMutation.mutate(editingId);
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium">This month&apos;s income</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : (incomes ?? []).length === 0 ? (
              <EmptyState
                icon={ArrowUpCircle}
               title="No money in yet this month"
                description="Add salary, freelance, or other income entries."
              />
            ) : (
              <>
                <BulkSelectToolbar
                  totalCount={incomeSelection.totalCount}
                  selectedCount={incomeSelection.selectedCount}
                  allSelected={incomeSelection.allSelected}
                  onToggleAll={incomeSelection.toggleAll}
                  onDeleteSelected={() =>
                    deleteSelectedIncome(incomeSelection.selectedIds, incomeSelection.clear)
                  }
                  deleting={bulkDeleting || deleteMutation.isPending}
                  itemLabel="income entries"
                />
                <div className="space-y-2">
                {(incomes ?? []).map((inc) => (
                  <EditableListRow
                    key={inc.id}
                    selectionMode
                    selected={incomeSelection.isSelected(inc.id)}
                    onSelectChange={() => incomeSelection.toggle(inc.id)}
                    onEdit={() => openEdit(inc)}
                    onDelete={(e) => handleDelete(inc.id, inc.notes || 'this income', e)}
                    deleteDisabled={deleteMutation.isPending || bulkDeleting}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-[10px]">{formatType(inc.type)}</Badge>
                      <div>
                        <p className="text-sm font-medium">{inc.notes || inc.category || 'Income'}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(inc.date)}</p>
                      </div>
                      <span className="ml-auto font-semibold text-emerald-600 shrink-0">
                        +₹{(Number(inc.amount) / 100).toLocaleString()}
                      </span>
                    </div>
                  </EditableListRow>
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
