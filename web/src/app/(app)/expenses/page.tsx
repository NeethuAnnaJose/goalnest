'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus, RotateCcw, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { BulkSelectToolbar } from '@/components/ui/bulk-select-toolbar';
import { EditableListRow } from '@/components/ui/editable-list-row';
import { useBulkDelete } from '@/hooks/use-bulk-delete';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { expensesApi, usersApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/api/client';
import { useConfirmDelete } from '@/hooks/use-confirm-delete';
import { formatDate } from '@/lib/format';
import { defaultDateForMonth, formatMonthLabel, isDateInMonth } from '@/lib/financial-year';
import { useFinancialYear } from '@/providers/financial-year-provider';
import type { Expense } from '@/types/api';

const CATEGORIES = [
  'FOOD', 'RENT', 'UTILITIES', 'SHOPPING', 'TRAVEL', 'ENTERTAINMENT',
  'HEALTHCARE', 'EDUCATION', 'TRANSPORTATION', 'INSURANCE', 'OTHER',
];

type TrackerRow =
  | { kind: 'standard'; category: string }
  | { kind: 'custom'; name: string };

function formatCategoryLabel(category: string) {
  return category.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

function customBudgetKey(name: string) {
  return `OTHER:${name.toLowerCase()}`;
}

function toMajor(amount: string | number) {
  return Number(amount) / 100;
}

function isSameDay(dateStr: string, referenceDate: string) {
  return dateStr.split('T')[0] === referenceDate.split('T')[0];
}

function formatMoney(value: number) {
  return `₹${value.toLocaleString()}`;
}

function getExpenseName(exp: Expense) {
  return (exp.description || exp.merchant || '').trim();
}

function collectCustomOtherNames(
  expenses: Expense[] | undefined,
  savedBudgets: Record<string, string>,
  budgetLimits: Record<string, string>,
  customTrackerCategories: string[],
) {
  const byKey = new Map<string, string>();

  const addName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (!byKey.has(key)) byKey.set(key, trimmed);
  };

  for (const name of customTrackerCategories) addName(name);
  for (const exp of expenses ?? []) {
    if (exp.category === 'OTHER') {
      const name = getExpenseName(exp);
      if (name) addName(name);
    }
  }
  for (const key of [...Object.keys(savedBudgets), ...Object.keys(budgetLimits)]) {
    if (!key.startsWith('OTHER:')) continue;
    const slug = key.slice(6);
    if (!byKey.has(slug)) {
      byKey.set(slug, slug.charAt(0).toUpperCase() + slug.slice(1));
    }
  }

  return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b));
}

export default function ExpensesPage() {
  const { financialYear, financialYearLabel, activeMonth, fyMonths, isReady } = useFinancialYear();
  const queryClient = useQueryClient();
  const { confirmDelete } = useConfirmDelete();

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'expense' | 'limit'>('expense');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState('FOOD');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => defaultDateForMonth(activeMonth));
  const [description, setDescription] = useState('');
  const [budgetLimits, setBudgetLimits] = useState<Record<string, string>>({});
  const [dailyAmounts, setDailyAmounts] = useState<Record<string, string>>({});
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [showRestore, setShowRestore] = useState(false);
  const [month, setMonth] = useState(activeMonth);
  const addDateForMonth = useMemo(() => defaultDateForMonth(month), [month]);

  useEffect(() => {
    setMonth(activeMonth);
    setDate(defaultDateForMonth(activeMonth));
  }, [activeMonth, financialYear]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => usersApi.getProfile(),
  });

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', financialYear, month],
    queryFn: () => expensesApi.list({ month }),
    enabled: isReady && !!financialYear,
  });

  const expenseIds = useMemo(() => (expenses ?? []).map((e) => e.id), [expenses]);
  const expenseSelection = useBulkSelection(expenseIds);
  const { deleteSelected: deleteSelectedExpenses, deleting: bulkDeleting } = useBulkDelete({
    deleteFn: (id) => expensesApi.delete(id),
    itemLabel: 'expenses',
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-breakdown'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (editingId && expenseSelection.selectedIds.includes(editingId)) resetExpenseForm();
    },
  });

  const { data: breakdown } = useQuery({
    queryKey: ['expenses-breakdown', financialYear, month],
    queryFn: () => expensesApi.breakdown({ month }),
    enabled: isReady && !!financialYear,
  });

  const savedBudgets = useMemo(
    () => profile?.financialPreferences?.categoryBudgets ?? {},
    [profile],
  );

  const customTrackerCategories = useMemo(
    () => profile?.financialPreferences?.customTrackerCategories ?? [],
    [profile],
  );

  const hasBudgetChanges = useMemo(() => {
    for (const [key, value] of Object.entries(budgetLimits)) {
      const saved = savedBudgets[key] ?? '';
      if (String(value) !== String(saved)) return true;
    }
    return false;
  }, [budgetLimits, savedBudgets]);

  const hiddenCategories = useMemo(
    () => profile?.financialPreferences?.hiddenTrackerCategories ?? [],
    [profile],
  );

  const visibleStandardCategories = useMemo(
    () => CATEGORIES.filter((c) => c !== 'OTHER' && !hiddenCategories.includes(c)),
    [hiddenCategories],
  );

  const customOtherNames = useMemo(
    () => collectCustomOtherNames(expenses, savedBudgets, budgetLimits, customTrackerCategories),
    [expenses, savedBudgets, budgetLimits, customTrackerCategories],
  );

  const visibleCustomNames = useMemo(
    () => customOtherNames.filter((name) => !hiddenCategories.includes(customBudgetKey(name))),
    [customOtherNames, hiddenCategories],
  );

  const restorableHiddenCategories = useMemo(
    () => hiddenCategories.filter((key) => key !== 'OTHER'),
    [hiddenCategories],
  );

  const trackerRows = useMemo((): TrackerRow[] => {
    const rows: TrackerRow[] = visibleStandardCategories.map((category) => ({
      kind: 'standard',
      category,
    }));
    for (const name of visibleCustomNames) {
      rows.push({ kind: 'custom', name });
    }
    return rows;
  }, [visibleStandardCategories, visibleCustomNames]);

  const effectiveBudgets = { ...savedBudgets, ...budgetLimits };

  const cleanCategoryBudgets = (budgets: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(budgets).filter(
        ([, v]) => v !== undefined && v !== null && String(v).trim() !== '' && parseFloat(String(v)) > 0,
      ),
    );

  const getLimitDisplayValue = (budgetKey: string) => {
    if (budgetKey in budgetLimits) return budgetLimits[budgetKey];
    return savedBudgets[budgetKey] ?? '';
  };

  const clearLocalBudgetKey = (key: string) => {
    setBudgetLimits((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const monthlySpent = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of breakdown ?? []) {
      map[item.category] = toMajor(item.amount);
    }
    return map;
  }, [breakdown]);

  const customMonthlySpent = useMemo(() => {
    const map: Record<string, number> = {};
    for (const exp of expenses ?? []) {
      if (exp.category !== 'OTHER') continue;
      const name = getExpenseName(exp);
      if (!name) continue;
      const key = customBudgetKey(name);
      map[key] = (map[key] ?? 0) + toMajor(exp.amount);
    }
    return map;
  }, [expenses]);

  const todaySpent = useMemo(() => {
    const standard: Record<string, number> = {};
    const custom: Record<string, number> = {};
    for (const exp of expenses ?? []) {
      if (!isSameDay(exp.date, addDateForMonth)) continue;
      if (exp.category === 'OTHER') {
        const name = getExpenseName(exp);
        if (name) {
          const key = customBudgetKey(name);
          custom[key] = (custom[key] ?? 0) + toMajor(exp.amount);
        }
      } else {
        standard[exp.category] = (standard[exp.category] ?? 0) + toMajor(exp.amount);
      }
    }
    return { standard, custom };
  }, [expenses, addDateForMonth]);

  const savePrefsMutation = useMutation({
    mutationFn: (prefs: Record<string, unknown>) =>
      usersApi.updateProfile({
        financialPreferences: {
          ...(profile?.financialPreferences ?? {}),
          ...prefs,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  useEffect(() => {
    if (!isReady || profileLoading || !profile) return;
    if (hiddenCategories.includes('OTHER')) return;
    savePrefsMutation.mutate({ hiddenTrackerCategories: [...hiddenCategories, 'OTHER'] });
  }, [isReady, profileLoading, profile, hiddenCategories, savePrefsMutation]);

  const saveBudgetsMutation = useMutation({
    mutationFn: () =>
      savePrefsMutation.mutateAsync({
        categoryBudgets: cleanCategoryBudgets(effectiveBudgets),
      }),
    onSuccess: () => {
      setBudgetLimits({});
      toast.success('Limits saved');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const createMutation = useMutation({
    mutationFn: (data: { category: string; amount: string; date: string; description?: string }) =>
      expensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-breakdown'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; category: string; amount: string; date: string; description?: string }) =>
      expensesApi.update(data.id, {
        category: data.category,
        amount: data.amount,
        date: data.date,
        description: data.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-breakdown'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Expense updated');
      resetExpenseForm();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-breakdown'] });
      toast.success('Deleted');
      if (editingId) resetExpenseForm();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const resetExpenseForm = () => {
    setShowForm(false);
    setFormMode('expense');
    setEditingId(null);
    setAmount('');
    setDescription('');
    setCategory('FOOD');
    setDate(addDateForMonth);
  };

  const openExpenseForm = () => {
    setFormMode('expense');
    setEditingId(null);
    setAmount('');
    setDescription('');
    setShowForm(true);
  };

  const openLimitForm = () => {
    setFormMode('limit');
    setEditingId(null);
    setAmount('');
    setDescription('');
    setShowForm(true);
  };

  const getTrackerKeysForExpense = (expenseCategory: string, expenseName?: string) => {
    const keys: string[] = [];
    if (expenseCategory === 'OTHER') {
      if (expenseName?.trim()) keys.push(customBudgetKey(expenseName.trim()));
    } else {
      keys.push(expenseCategory);
    }
    return keys;
  };

  const restoreTrackerCategoriesIfHidden = async (keys: string[]) => {
    const toRestore = keys.filter((k) => hiddenCategories.includes(k));
    if (toRestore.length === 0) return;
    await savePrefsMutation.mutateAsync({
      hiddenTrackerCategories: hiddenCategories.filter((k) => !toRestore.includes(k)),
    });
  };

  const openEditExpense = (exp: Expense) => {
    setFormMode('expense');
    setEditingId(exp.id);
    setShowForm(true);
    setCategory(exp.category);
    setAmount(String(toMajor(exp.amount)));
    setDate(exp.date.split('T')[0]);
    setDescription(exp.description || exp.merchant || '');
  };

  const invalidateExpenseQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['expenses-breakdown'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
  };

  const getBudgetKey = (row: TrackerRow) => {
    if (row.kind === 'standard') return row.category;
    if (row.kind === 'custom') return customBudgetKey(row.name);
    return null;
  };

  const getRowLabel = (row: TrackerRow) =>
    row.kind === 'standard' ? formatCategoryLabel(row.category) : row.name;

  const getRowSpent = (row: TrackerRow) => {
    if (row.kind === 'standard') return monthlySpent[row.category] ?? 0;
    if (row.kind === 'custom') return customMonthlySpent[customBudgetKey(row.name)] ?? 0;
    return 0;
  };

  const getRowToday = (row: TrackerRow) => {
    if (row.kind === 'standard') return todaySpent.standard[row.category] ?? 0;
    if (row.kind === 'custom') return todaySpent.custom[customBudgetKey(row.name)] ?? 0;
    return 0;
  };

  const getBudgetStatus = (budgetKey: string | null, spent: number) => {
    if (!budgetKey) return { limit: 0, remaining: null, percent: 0, exceeded: false };
    const limit = parseFloat(effectiveBudgets[budgetKey] ?? '');
    if (!limit || limit <= 0) return { limit: 0, remaining: null, percent: 0, exceeded: false };
    const remaining = limit - spent;
    const percent = Math.min((spent / limit) * 100, 100);
    return { limit, remaining, percent, exceeded: spent > limit };
  };

  const showAddResult = (
    label: string,
    budgetKey: string | null,
    addedAmount: number,
    currentSpent: number,
    result: { budgetAlert?: { body: string } | null },
  ) => {
    invalidateExpenseQueries();

    if (result.budgetAlert) {
      toast.error(result.budgetAlert.body, { duration: 6000 });
      return;
    }

    const limit = budgetKey ? parseFloat(effectiveBudgets[budgetKey] ?? '') : 0;
    const spent = currentSpent + addedAmount;
    if (limit > 0) {
      const remaining = limit - spent;
      toast.success(
        remaining >= 0
          ? `${formatMoney(addedAmount)} added. ${formatMoney(remaining)} left in ${label}.`
          : `${formatMoney(addedAmount)} added. Over limit by ${formatMoney(Math.abs(remaining))}.`,
      );
    } else {
      toast.success('Expense added');
    }
  };

  const upsertCustomTrackerCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return customTrackerCategories;
    if (customTrackerCategories.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      return customTrackerCategories;
    }
    return [...customTrackerCategories, trimmed];
  };

  const handleSaveLimit = async () => {
    const limitNum = parseFloat(amount);
    if (!amount || Number.isNaN(limitNum) || limitNum <= 0) {
      toast.error('Enter a valid limit');
      return;
    }
    if (category === 'OTHER' && !description.trim()) {
      toast.error('Enter a name for this category');
      return;
    }

    const budgetKey = category === 'OTHER' ? customBudgetKey(description.trim()) : category;
    const label = category === 'OTHER' ? description.trim() : formatCategoryLabel(category);
    const updatedBudgets = cleanCategoryBudgets({
      ...savedBudgets,
      ...budgetLimits,
      [budgetKey]: amount,
    });
    const keysToRestore = getTrackerKeysForExpense(category, description.trim() || undefined);
    const updatedHidden = hiddenCategories.filter((k) => !keysToRestore.includes(k));

    try {
      await savePrefsMutation.mutateAsync({
        categoryBudgets: updatedBudgets,
        hiddenTrackerCategories: updatedHidden,
        ...(category === 'OTHER'
          ? { customTrackerCategories: upsertCustomTrackerCategory(description.trim()) }
          : {}),
      });
      setBudgetLimits({});
      toast.success(`${label} limit set to ${formatMoney(limitNum)}`);
      resetExpenseForm();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const handleSaveExpense = async () => {
    if (category === 'OTHER' && !description.trim()) {
      toast.error('Please enter a name for this expense');
      return;
    }
    if (!isDateInMonth(date, month)) {
      toast.error(`Date must be in ${formatMonthLabel(month)}`);
      return;
    }

    const expenseDate = date;
    const payload = {
      category,
      amount,
      date: expenseDate,
      description: description.trim() || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
      return;
    }

    const budgetKey = category === 'OTHER' ? customBudgetKey(description.trim()) : category;
    const label = category === 'OTHER' ? description.trim() : formatCategoryLabel(category);
    const currentSpent = category === 'OTHER'
      ? (customMonthlySpent[budgetKey] ?? 0)
      : (monthlySpent[category] ?? 0);

    try {
      await restoreTrackerCategoriesIfHidden(
        getTrackerKeysForExpense(category, description.trim() || undefined),
      );
      if (category === 'OTHER') {
        await savePrefsMutation.mutateAsync({
          customTrackerCategories: upsertCustomTrackerCategory(description.trim()),
        });
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: (result) => {
        showAddResult(label, budgetKey, Number(amount), currentSpent, result);
        resetExpenseForm();
      },
    });
  };

  const handleDeleteExpense = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (await confirmDelete('this expense')) deleteMutation.mutate(id);
  };

  const handleAddCustomCategory = async () => {
    const name = customCategoryName.trim();
    if (!name) {
      toast.error('Enter a name for this category');
      return;
    }

    const key = customBudgetKey(name);
    if (visibleCustomNames.some((n) => customBudgetKey(n) === key)) {
      toast.error('This category is already in the tracker');
      return;
    }

    const keysToRestore = getTrackerKeysForExpense('OTHER', name);
    const updatedHidden = hiddenCategories.filter((k) => !keysToRestore.includes(k));

    try {
      await savePrefsMutation.mutateAsync({
        customTrackerCategories: upsertCustomTrackerCategory(name),
        hiddenTrackerCategories: updatedHidden,
      });
      setCustomCategoryName('');
      setShowAddCategory(false);
      toast.success(`${name} added to tracker`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const handleDailyAdd = (row: TrackerRow) => {
    const rowKey = row.kind === 'custom' ? customBudgetKey(row.name) : row.category;
    const value = dailyAmounts[rowKey];

    if (!value || Number(value) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    const expenseCategory = row.kind === 'standard' ? row.category : 'OTHER';
    const expenseName = row.kind === 'custom' ? row.name : undefined;
    const budgetKey = row.kind === 'standard'
      ? row.category
      : customBudgetKey(expenseName!);
    const label = row.kind === 'standard'
      ? formatCategoryLabel(row.category)
      : expenseName!;
    const currentSpent = row.kind === 'standard'
      ? (monthlySpent[row.category] ?? 0)
      : (customMonthlySpent[budgetKey] ?? 0);

    void restoreTrackerCategoriesIfHidden(
      getTrackerKeysForExpense(expenseCategory, expenseName),
    ).then(async () => {
      if (expenseCategory === 'OTHER' && expenseName) {
        await savePrefsMutation.mutateAsync({
          customTrackerCategories: upsertCustomTrackerCategory(expenseName),
        });
      }
      createMutation.mutate(
      {
        category: expenseCategory,
        amount: value,
        date: addDateForMonth,
        description: expenseName,
      },
      {
        onSuccess: (result) => {
          showAddResult(label, budgetKey, Number(value), currentSpent, result);
          setDailyAmounts((prev) => {
            const next = { ...prev };
            delete next[rowKey];
            return next;
          });
        },
      },
    );
    }).catch((e) => toast.error(getErrorMessage(e)));
  };

  const hideRow = (row: TrackerRow) => {
    const key = row.kind === 'standard' ? row.category : customBudgetKey(row.name);
    const label = getRowLabel(row);
    const updatedHidden = [...hiddenCategories, key];
    const budgetsWithoutKey = cleanCategoryBudgets(
      Object.fromEntries(
        Object.entries({ ...savedBudgets, ...budgetLimits }).filter(([k]) => k !== key),
      ),
    );
    clearLocalBudgetKey(key);
    setDailyAmounts((prev) => {
      const dailyKey = row.kind === 'standard' ? row.category : customBudgetKey(row.name);
      if (!(dailyKey in prev)) return prev;
      const next = { ...prev };
      delete next[dailyKey];
      return next;
    });
    const updatedCustom = row.kind === 'custom'
      ? customTrackerCategories.filter((n) => customBudgetKey(n) !== key)
      : customTrackerCategories;

    savePrefsMutation.mutate(
      {
        hiddenTrackerCategories: updatedHidden,
        categoryBudgets: budgetsWithoutKey,
        customTrackerCategories: updatedCustom,
      },
      { onSuccess: () => toast.success(`${label} removed from tracker`) },
    );
  };

  const restoreCategory = (key: string) => {
    const updatedHidden = hiddenCategories.filter((c) => c !== key);
    const budgetsWithoutKey = cleanCategoryBudgets(
      Object.fromEntries(
        Object.entries({ ...savedBudgets, ...budgetLimits }).filter(([k]) => k !== key),
      ),
    );
    clearLocalBudgetKey(key);
    const restoredCustom = key.startsWith('OTHER:') && key !== 'OTHER'
      ? upsertCustomTrackerCategory(key.slice(6))
      : customTrackerCategories;

    savePrefsMutation.mutate(
      {
        hiddenTrackerCategories: updatedHidden,
        categoryBudgets: budgetsWithoutKey,
        customTrackerCategories: restoredCustom,
      },
      {
        onSuccess: () => {
          const label = key.startsWith('OTHER:')
            ? key.slice(6)
            : formatCategoryLabel(key);
          toast.success(`${label} restored`);
        },
      },
    );
  };

  const getDailyKey = (row: TrackerRow) =>
    row.kind === 'custom' ? customBudgetKey(row.name) : row.category;

  const loading = isLoading || profileLoading;

  const renderRow = (row: TrackerRow) => {
    const budgetKey = getBudgetKey(row);
    const spent = getRowSpent(row);
    const todayAmount = getRowToday(row);
    const status = getBudgetStatus(budgetKey, spent);
    const dailyKey = getDailyKey(row);
    const label = getRowLabel(row);

    return (
      <tr key={dailyKey} className="border-b border-border/50 last:border-0">
        <td className="py-1.5 pr-2 font-medium whitespace-nowrap">{label}</td>
        <td className="py-1.5 pr-2">
          {budgetKey && (
            <Input
              type="number"
              className="h-7 w-full text-xs px-2"
              placeholder="-"
              value={getLimitDisplayValue(budgetKey)}
              onChange={(e) =>
                setBudgetLimits((prev) => ({ ...prev, [budgetKey]: e.target.value }))
              }
              onBlur={() => {
                const current = getLimitDisplayValue(budgetKey);
                if (current !== '' && current !== undefined) return;
                if (!savedBudgets[budgetKey]) return;
                const budgetsWithoutKey = cleanCategoryBudgets(
                  Object.fromEntries(
                    Object.entries({ ...savedBudgets, ...budgetLimits }).filter(([k]) => k !== budgetKey),
                  ),
                );
                clearLocalBudgetKey(budgetKey);
                savePrefsMutation.mutate({ categoryBudgets: budgetsWithoutKey });
              }}
            />
          )}
        </td>
        <td className="py-1.5 pr-2 text-right tabular-nums">{formatMoney(spent)}</td>
        <td className={`py-1.5 pr-2 text-right tabular-nums ${status.remaining !== null ? (status.remaining < 0 ? 'text-destructive font-medium' : 'text-emerald-600 font-medium') : ''}`}>
          {status.remaining !== null ? formatMoney(status.remaining) : '-'}
        </td>
        <td className="py-1.5 pr-2 text-right tabular-nums">
          {todayAmount > 0 ? formatMoney(todayAmount) : '-'}
        </td>
        <td className="py-1.5 pr-2">
          <div className="flex flex-wrap gap-1">
            <Input
              type="number"
              className="h-7 w-14 text-xs px-1.5"
              placeholder="₹"
              value={dailyAmounts[dailyKey] ?? ''}
              onChange={(e) =>
                setDailyAmounts((prev) => ({ ...prev, [dailyKey]: e.target.value }))
              }
              onKeyDown={(e) => e.key === 'Enter' && handleDailyAdd(row)}
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => handleDailyAdd(row)}
              disabled={createMutation.isPending || savePrefsMutation.isPending}
              title="Add expense"
            >
              +
            </Button>
          </div>
        </td>
        <td className="py-1.5">
          {status.limit > 0 ? (
            <div className="flex items-center gap-1.5">
              <Progress
                value={status.percent}
                className={`h-1.5 w-12 ${status.exceeded ? '[&>div]:bg-destructive' : ''}`}
              />
              {status.exceeded ? (
                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
              ) : (
                <span className="text-muted-foreground">{Math.round(status.percent)}%</span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </td>
        <td className="py-1.5 text-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Remove from tracker"
            onClick={() => hideRow(row)}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </td>
      </tr>
    );
  };

  return (
    <>
      <Header title="Spending" description={financialYearLabel} />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={month}
            onValueChange={(m) => {
              setMonth(m);
              if (!editingId) setDate(defaultDateForMonth(m));
            }}
          >
            <SelectTrigger className="h-8 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fyMonths.map((m) => (
                <SelectItem key={m} value={m}>{formatMonthLabel(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant={showForm && formMode === 'limit' ? 'default' : 'outline'} onClick={openLimitForm}>
            <Plus className="mr-1.5 h-4 w-4" />
            Set Limit
          </Button>
          <Button size="sm" variant={showForm && formMode === 'expense' ? 'default' : 'outline'} onClick={openExpenseForm}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Expense
          </Button>
          {hasBudgetChanges && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => saveBudgetsMutation.mutate()}
              disabled={saveBudgetsMutation.isPending}
            >
              <Save className="mr-1.5 h-4 w-4" />
              Save Limits
            </Button>
          )}
          {restorableHiddenCategories.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setShowRestore(!showRestore)}>
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Restore ({restorableHiddenCategories.length})
            </Button>
          )}
        </div>

        {showRestore && restorableHiddenCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 rounded-lg border bg-card p-2">
            {restorableHiddenCategories.map((key) => (
              <Button key={key} size="sm" variant="outline" className="h-7 text-xs" onClick={() => restoreCategory(key)}>
                + {key.startsWith('OTHER:') ? key.slice(6) : formatCategoryLabel(key)}
              </Button>
            ))}
          </div>
        )}

        {showForm && (
          <div className="rounded-lg border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">
                {editingId ? 'Edit expense' : formMode === 'limit' ? 'Set budget limit' : 'New expense'}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetExpenseForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[130px] flex-1">
                <Label className="text-xs">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{formatCategoryLabel(c)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <Label className="text-xs">{formMode === 'limit' && !editingId ? 'Limit' : 'Amount'}</Label>
                <Input className="h-8 mt-1" type="number" placeholder="₹" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              {formMode === 'expense' && (
                <div className="w-36">
                  <Label className="text-xs">Date</Label>
                  <Input className="h-8 mt-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              )}
              {(formMode === 'expense' || category === 'OTHER') && (
                <div className="min-w-[140px] flex-1">
                  <Label className="text-xs">{category === 'OTHER' ? 'Name' : 'Note'}</Label>
                  <Input
                    className="h-8 mt-1"
                    placeholder={category === 'OTHER' ? 'Required' : 'Optional'}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              )}
              <Button
                size="sm"
                className="h-8"
                onClick={formMode === 'limit' && !editingId ? handleSaveLimit : handleSaveExpense}
                disabled={
                  !amount ||
                  (formMode === 'limit' && !editingId
                    ? savePrefsMutation.isPending
                    : createMutation.isPending || updateMutation.isPending) ||
                  (category === 'OTHER' && !description.trim())
                }
              >
                {editingId ? 'Save changes' : 'Save'}
              </Button>
              {editingId && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8"
                  onClick={async () => {
                    if (await confirmDelete('this expense')) deleteMutation.mutate(editingId);
                  }}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 py-3 px-4">
            <CardTitle className="text-sm font-medium">Budget tracker</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setShowAddCategory((v) => !v)}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add category
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {showAddCategory && (
              <div className="mb-3 flex flex-wrap items-end gap-2 rounded-md border bg-muted/30 p-2">
                <div className="min-w-[140px] flex-1">
                  <Label className="text-xs">Category name</Label>
                  <Input
                    className="h-8 mt-1"
                    placeholder="e.g. Subscriptions"
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleAddCustomCategory()}
                  />
                </div>
                <Button
                  size="sm"
                  className="h-8"
                  onClick={() => void handleAddCustomCategory()}
                  disabled={!customCategoryName.trim() || savePrefsMutation.isPending}
                >
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={() => {
                    setShowAddCategory(false);
                    setCustomCategoryName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : trackerRows.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground space-y-2">
                <p>All categories hidden. Set a limit or restore categories to see the tracker.</p>
                {restorableHiddenCategories.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      savePrefsMutation.mutate(
                        { hiddenTrackerCategories: ['OTHER'] },
                        { onSuccess: () => toast.success('All categories restored') },
                      );
                    }}
                  >
                    Restore all categories
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="pb-2 pr-2 text-left font-medium">Category</th>
                      <th className="pb-2 pr-2 text-left font-medium w-20">Limit</th>
                      <th className="pb-2 pr-2 text-right font-medium">Spent</th>
                      <th className="pb-2 pr-2 text-right font-medium">Left</th>
                      <th className="pb-2 pr-2 text-right font-medium">Today</th>
                      <th className="pb-2 pr-2 text-left font-medium">Add</th>
                      <th className="pb-2 pr-2 text-left font-medium w-20">Status</th>
                      <th className="pb-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {trackerRows.map((row) => renderRow(row))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium">This month</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (expenses ?? []).length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">No expenses yet.</p>
            ) : (
              <>
                <BulkSelectToolbar
                  totalCount={expenseSelection.totalCount}
                  selectedCount={expenseSelection.selectedCount}
                  allSelected={expenseSelection.allSelected}
                  onToggleAll={expenseSelection.toggleAll}
                  onDeleteSelected={() =>
                    deleteSelectedExpenses(expenseSelection.selectedIds, expenseSelection.clear)
                  }
                  deleting={bulkDeleting || deleteMutation.isPending}
                  itemLabel="expenses"
                />
                <div className="max-h-56 space-y-1 overflow-y-auto">
                {(expenses ?? []).map((exp: Expense) => (
                  <EditableListRow
                    key={exp.id}
                    className="p-2 sm:p-3"
                    selectionMode
                    selected={expenseSelection.isSelected(exp.id)}
                    onSelectChange={() => expenseSelection.toggle(exp.id)}
                    onEdit={() => openEditExpense(exp)}
                    onDelete={(e) => handleDeleteExpense(exp.id, e)}
                    deleteDisabled={deleteMutation.isPending || bulkDeleting}
                  >
                    <div className="flex min-w-0 items-center gap-2 text-sm">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                        {exp.category === 'OTHER'
                          ? (getExpenseName(exp) || 'Other')
                          : formatCategoryLabel(exp.category)}
                      </Badge>
                      {exp.category !== 'OTHER' && (
                        <span className="truncate text-xs">
                          {exp.description || exp.merchant || 'Expense'}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(exp.date)}</span>
                      <span className="ml-auto text-xs font-semibold tabular-nums shrink-0">
                        {formatMoney(toMajor(exp.amount))}
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
