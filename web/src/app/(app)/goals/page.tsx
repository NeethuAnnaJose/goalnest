'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Banknote, Calculator, Car, GraduationCap, Heart, Home, Lightbulb,
  Palmtree, Shield, Target, Trash2, TrendingDown, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { dashboardApi, goalsApi, housePlannerApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/api/client';
import { useConfirmDelete } from '@/hooks/use-confirm-delete';
import { usePrompt } from '@/providers/prompt-provider';
import { EmptyState } from '@/components/ui/empty-state';
import { BulkSelectToolbar } from '@/components/ui/bulk-select-toolbar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useBulkDelete } from '@/hooks/use-bulk-delete';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Goal, LoanOffersResult } from '@/types/api';

const IDEAL_MONTHS: Record<string, number> = {
  HOUSE: 180,
  CAR: 48,
  WEDDING: 36,
  VACATION: 12,
  EDUCATION: 60,
  EMERGENCY_FUND: 24,
  CUSTOM: 36,
};

const LOAN_ELIGIBLE_TYPES = new Set(['HOUSE', 'CAR']);
const REFERENCE_LOAN_RATE = '8.5';

const PLANNER_TYPES = [
  { value: 'HOUSE', label: 'House', icon: Home },
  { value: 'CAR', label: 'Car', icon: Car },
  { value: 'WEDDING', label: 'Wedding', icon: Heart },
  { value: 'VACATION', label: 'Vacation', icon: Palmtree },
  { value: 'EDUCATION', label: 'Education', icon: GraduationCap },
  { value: 'EMERGENCY_FUND', label: 'Emergency Fund', icon: Shield },
  { value: 'CUSTOM', label: 'Custom', icon: Target },
];

const PLANNER_DEFAULTS: Record<string, { name: string; amount: string; monthly: string }> = {
  HOUSE: { name: 'Home purchase', amount: '5000000', monthly: '35000' },
  CAR: { name: 'My Car', amount: '800000', monthly: '15000' },
  WEDDING: { name: 'Wedding', amount: '500000', monthly: '25000' },
  VACATION: { name: 'Vacation', amount: '150000', monthly: '10000' },
  EDUCATION: { name: 'Education', amount: '1000000', monthly: '20000' },
  EMERGENCY_FUND: { name: 'Emergency Fund', amount: '300000', monthly: '15000' },
  CUSTOM: { name: 'Custom Goal', amount: '100000', monthly: '5000' },
};

function formatLabel(type: string) {
  return PLANNER_TYPES.find((t) => t.value === type)?.label
    ?? type.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

interface ContributionPlan {
  goalAmount: number;
  monthlyContribution: number;
  amountRemaining: number;
  monthsRemaining: number;
  yearsRemaining: number;
  estimatedDate: Date;
}

function parseGoalPlan(notes?: string | null) {
  if (!notes) return null;
  try {
    return JSON.parse(notes) as {
      planType?: string;
      contributionPlan?: {
        goalAmount: string;
        monthlyContribution: string;
        monthsRemaining: number;
        yearsRemaining: number;
        amountRemaining: number;
        estimatedDate: string;
      };
      savingsPlan?: {
        targetAmount: string;
        monthlySavingsNeeded: number;
        monthsRemaining: number;
      };
    };
  } catch {
    return null;
  }
}

function roundToNice(amount: number): number {
  if (amount >= 100000) return Math.ceil(amount / 5000) * 5000;
  if (amount >= 10000) return Math.ceil(amount / 1000) * 1000;
  if (amount >= 1000) return Math.ceil(amount / 500) * 500;
  return Math.max(100, Math.ceil(amount / 100) * 100);
}

function getRecommendedContribution(
  goalAmount: number,
  plannerType: string,
  safeToSpend?: number,
) {
  if (goalAmount <= 0) return null;

  const targetMonths = IDEAL_MONTHS[plannerType] ?? 36;
  let amount = goalAmount / targetMonths;

  let cappedByBudget = false;
  if (safeToSpend && safeToSpend > 0) {
    const budgetCap = safeToSpend * 0.35;
    if (amount > budgetCap) {
      amount = budgetCap;
      cappedByBudget = true;
    }
  }

  amount = roundToNice(amount);
  const monthsToGoal = Math.ceil(goalAmount / amount);

  return {
    amount,
    monthsToGoal,
    yearsToGoal: Math.round((monthsToGoal / 12) * 10) / 10,
    cappedByBudget,
    targetYears: Math.round((targetMonths / 12) * 10) / 10,
  };
}

const MAX_REALISTIC_AMOUNT = 1_000_000_000_000; // 1 trillion

function validateContributionInputs(goalAmount: number, monthlyContribution: number) {
  if (!Number.isFinite(goalAmount) || !Number.isFinite(monthlyContribution)) {
    return 'Enter valid numbers';
  }
  if (goalAmount <= 0) {
    return 'Goal amount must be greater than zero';
  }
  if (monthlyContribution <= 0) {
    return 'Monthly contribution must be greater than zero';
  }
  if (goalAmount > MAX_REALISTIC_AMOUNT || monthlyContribution > MAX_REALISTIC_AMOUNT) {
    return 'Amount is too large. Please enter a realistic value.';
  }
  if (monthlyContribution > goalAmount) {
    return 'Monthly contribution cannot exceed your goal amount';
  }
  return null;
}

function calculateContributionPlan(
  goalAmount: number,
  monthlyContribution: number,
  currentSavings = 0,
): ContributionPlan | null {
  if (validateContributionInputs(goalAmount, monthlyContribution)) return null;

  const amountRemaining = Math.max(0, goalAmount - currentSavings);
  const monthsRemaining = amountRemaining === 0 ? 0 : Math.ceil(amountRemaining / monthlyContribution);
  const estimatedDate = new Date();
  if (monthsRemaining > 0) {
    estimatedDate.setMonth(estimatedDate.getMonth() + monthsRemaining);
  }

  return {
    goalAmount,
    monthlyContribution,
    amountRemaining,
    monthsRemaining,
    yearsRemaining: Math.round((monthsRemaining / 12) * 10) / 10,
    estimatedDate,
  };
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onAddProgress,
  selected,
  onSelectChange,
  selectionMode,
}: {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onAddProgress: (id: string, e: React.MouseEvent) => void;
  selected?: boolean;
  onSelectChange?: () => void;
  selectionMode?: boolean;
}) {
  const plan = parseGoalPlan(goal.notes);
  const plannerMeta = PLANNER_TYPES.find((t) => t.value === goal.type);
  const Icon = plannerMeta?.icon ?? Target;

  return (
    <Card
      className={`transition-colors hover:border-primary/40 hover:bg-muted/30 ${
        selected ? 'border-primary/40 bg-primary/5' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {selectionMode && onSelectChange && (
              <Checkbox
                checked={selected}
                onCheckedChange={onSelectChange}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <div className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer" onClick={() => onEdit(goal)}>
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{goal.name}</p>
                <Badge variant="secondary" className="mt-1 text-[10px]">{formatLabel(goal.type)}</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {goal.isCompleted && <Badge variant="success">Done</Badge>}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => onDelete(goal.id, e)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>

        <Progress value={goal.completionPercent ?? 0} className="mb-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>₹{goal.currentSavingsMajor ?? (Number(goal.currentSavings) / 100).toLocaleString()}</span>
          <span>₹{goal.targetAmountMajor ?? (Number(goal.targetAmount) / 100).toLocaleString()}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {goal.completionPercent ?? 0}% complete
          {goal.targetDate && ` · Target: ${formatDate(goal.targetDate)}`}
        </p>

        {(plan?.contributionPlan || plan?.savingsPlan) && (
          <div className="mt-3 rounded-md border bg-muted/30 p-2 space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Savings plan</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
              <span className="text-muted-foreground">Contribute per month</span>
              <span className="text-right font-medium">
                ₹{Number(
                  plan.contributionPlan?.monthlyContribution
                  ?? plan.savingsPlan?.monthlySavingsNeeded
                  ?? 0,
                ).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-muted-foreground">Time to goal</span>
              <span className="text-right font-medium">
                {plan.contributionPlan
                  ? `${plan.contributionPlan.monthsRemaining} mo (${plan.contributionPlan.yearsRemaining} yr)`
                  : `${plan.savingsPlan?.monthsRemaining ?? '-'} mo`}
              </span>
            </div>
          </div>
        )}

        {!goal.isCompleted && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3 h-7 text-xs"
            onClick={(e) => onAddProgress(goal.id, e)}
          >
            Add progress
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function GoalsPage() {
  const searchParams = useSearchParams();
  const [section, setSection] = useState<'goals' | 'planners'>('goals');
  const [plannerType, setPlannerType] = useState('HOUSE');

  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('5000000');
  const [monthlyContribution, setMonthlyContribution] = useState('35000');
  const [contributionPlan, setContributionPlan] = useState<ContributionPlan | null>(null);
  const [loanOffersOpen, setLoanOffersOpen] = useState(false);
  const [loanOffers, setLoanOffers] = useState<LoanOffersResult | null>(null);
  const [loadingOffers, setLoadingOffers] = useState(false);

  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editName, setEditName] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editDate, setEditDate] = useState('');

  const queryClient = useQueryClient();
  const { confirmDelete } = useConfirmDelete();
  const { prompt } = usePrompt();
  const activePlanner = PLANNER_TYPES.find((t) => t.value === plannerType)!;

  useEffect(() => {
    if (searchParams.get('tab') === 'house' || searchParams.get('tab') === 'planners') {
      setSection('planners');
      if (searchParams.get('tab') === 'house') setPlannerType('HOUSE');
    }
  }, [searchParams]);

  useEffect(() => {
    setContributionPlan(null);
    const defaults = PLANNER_DEFAULTS[plannerType] ?? PLANNER_DEFAULTS.CUSTOM;
    setGoalName(defaults.name);
    setGoalAmount(defaults.amount);
    setMonthlyContribution(defaults.monthly);
  }, [plannerType]);

  const { data: goals } = useQuery({ queryKey: ['goals'], queryFn: () => goalsApi.list() });
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get(),
    staleTime: 5 * 60 * 1000,
  });

  const safeToSpend = dashboard?.formatted?.safeToSpend
    ? Number(dashboard.formatted.safeToSpend)
    : undefined;

  const recommendation = useMemo(
    () => getRecommendedContribution(Number(goalAmount), plannerType, safeToSpend),
    [goalAmount, plannerType, safeToSpend],
  );

  const contributionError = useMemo(
    () => validateContributionInputs(Number(goalAmount), Number(monthlyContribution)),
    [goalAmount, monthlyContribution],
  );

  const showLoanOptions = LOAN_ELIGIBLE_TYPES.has(plannerType);

  useEffect(() => {
    if (contributionError) setContributionPlan(null);
  }, [contributionError]);

  const goalIds = useMemo(() => (goals ?? []).map((g) => g.id), [goals]);
  const goalSelection = useBulkSelection(goalIds);
  const { deleteSelected: deleteSelectedGoals, deleting: bulkDeleting } = useBulkDelete({
    deleteFn: (id) => goalsApi.delete(id),
    itemLabel: 'goals',
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (editingGoal && goalSelection.selectedIds.includes(editingGoal.id)) setEditingGoal(null);
    },
  });

  const plannerGoals = useMemo(
    () => (goals ?? []).filter((g) => g.type === plannerType),
    [goals, plannerType],
  );

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => goalsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Goal created');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const progressMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: string }) => goalsApi.addProgress(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Progress updated');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      goalsApi.update(editingGoal!.id, {
        name: editName.trim(),
        targetAmount: editTarget,
        targetDate: editDate || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal updated');
      setEditingGoal(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => goalsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal deleted');
      setEditingGoal(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const openEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setEditName(goal.name);
    setEditTarget(goal.targetAmountMajor ?? String(Number(goal.targetAmount) / 100));
    setEditDate(goal.targetDate ? goal.targetDate.split('T')[0] : '');
  };

  const handleDeleteGoal = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (await confirmDelete('this goal')) deleteMutation.mutate(id);
  };

  const handleAddProgress = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const amount = await prompt({
      title: 'Add progress',
      description: 'Record how much you have saved toward this goal.',
      label: 'Savings amount (₹)',
      placeholder: '0',
      inputType: 'number',
      confirmLabel: 'Add progress',
      validate: (value) => {
        const parsed = Number(value);
        if (!value.trim()) return 'Enter an amount';
        if (!Number.isFinite(parsed) || parsed <= 0) return 'Enter a valid amount greater than zero';
        return null;
      },
    });
    if (amount) progressMutation.mutate({ id, amount });
  };

  const handleCalculatePlan = () => {
    if (!goalAmount || !monthlyContribution) {
      toast.error('Enter goal amount and monthly contribution');
      return;
    }
    if (contributionError) {
      toast.error(contributionError);
      return;
    }
    const result = calculateContributionPlan(
      Number(goalAmount),
      Number(monthlyContribution),
    );
    if (!result) {
      toast.error('Could not calculate plan. Check your inputs.');
      return;
    }
    setContributionPlan(result);
    toast.success(`${activePlanner.label} plan calculated`);
  };

  const handleUseRecommended = () => {
    if (!recommendation) return;
    setMonthlyContribution(String(recommendation.amount));
    toast.success(`Set to recommended ₹${recommendation.amount.toLocaleString('en-IN')}/month`);
  };

  const handleGetLoanOffers = async () => {
    if (!goalAmount || !monthlyContribution) {
      toast.error('Enter goal amount and monthly contribution first');
      return;
    }
    if (contributionError) {
      toast.error(contributionError);
      return;
    }
    setLoadingOffers(true);
    setLoanOffersOpen(true);
    try {
      const result = await housePlannerApi.loanOffers({
        loanType: plannerType as 'HOUSE' | 'CAR',
        loanAmount: goalAmount,
        currentInterestRate: REFERENCE_LOAN_RATE,
        monthlyPayment: monthlyContribution,
      });
      setLoanOffers(result);
    } catch (e) {
      toast.error(getErrorMessage(e));
      setLoanOffersOpen(false);
    } finally {
      setLoadingOffers(false);
    }
  };

  const handleSaveGoal = () => {
    if (!contributionPlan || !goalName.trim()) {
      toast.error('Calculate a plan and enter a goal name');
      return;
    }
    createMutation.mutate({
      type: plannerType,
      name: goalName.trim(),
      targetAmount: goalAmount,
      targetDate: contributionPlan.estimatedDate.toISOString().split('T')[0],
      notes: JSON.stringify({
        planType: plannerType,
        contributionPlan: {
          goalAmount,
          monthlyContribution,
          monthsRemaining: contributionPlan.monthsRemaining,
          yearsRemaining: contributionPlan.yearsRemaining,
          amountRemaining: contributionPlan.amountRemaining,
          estimatedDate: contributionPlan.estimatedDate.toISOString(),
        },
      }),
    }, { onSuccess: () => setContributionPlan(null) });
  };

  return (
    <>
      <Header title="Goals" description="Track savings goals and plan for big purchases" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
          <button
            type="button"
            onClick={() => setSection('goals')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              section === 'goals' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Target className="h-4 w-4" />
            My Goals
          </button>
          <button
            type="button"
            onClick={() => setSection('planners')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              section === 'planners' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Calculator className="h-4 w-4" />
            Goal Planners
          </button>
        </div>

        {editingGoal && (
          <Card>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Edit {formatLabel(editingGoal.type)} goal</CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingGoal(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[140px] flex-1">
                  <Label className="text-xs">Name</Label>
                  <Input className="h-8 mt-1" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="w-28">
                  <Label className="text-xs">Target (₹)</Label>
                  <Input className="h-8 mt-1" type="number" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} />
                </div>
                <div className="w-36">
                  <Label className="text-xs">Target date</Label>
                  <Input className="h-8 mt-1" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                </div>
                <Button size="sm" className="h-8" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8"
                  onClick={async () => {
                    if (await confirmDelete('this goal')) deleteMutation.mutate(editingGoal.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {section === 'goals' && (
          <>
            {(goals ?? []).length === 0 ? (
              <EmptyState
                icon={Target}
                title="No goals yet"
                description="Create a goal or use a planner for house, car, wedding, and more."
                actionLabel="Open planners"
                onAction={() => setSection('planners')}
              />
            ) : (
              <>
                <BulkSelectToolbar
                  totalCount={goalSelection.totalCount}
                  selectedCount={goalSelection.selectedCount}
                  allSelected={goalSelection.allSelected}
                  onToggleAll={goalSelection.toggleAll}
                  onDeleteSelected={() =>
                    deleteSelectedGoals(goalSelection.selectedIds, goalSelection.clear)
                  }
                  deleting={bulkDeleting || deleteMutation.isPending}
                  itemLabel="goals"
                />
                <div className="grid gap-3 md:grid-cols-2">
                {(goals ?? []).map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={openEditGoal}
                    onDelete={handleDeleteGoal}
                    onAddProgress={handleAddProgress}
                    selectionMode
                    selected={goalSelection.isSelected(goal.id)}
                    onSelectChange={() => goalSelection.toggle(goal.id)}
                  />
                ))}
                </div>
              </>
            )}
          </>
        )}

        {section === 'planners' && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {PLANNER_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPlannerType(value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    plannerType === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:border-foreground/20',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <activePlanner.icon className="h-4 w-4" />
                    Plan your {activePlanner.label.toLowerCase()} goal
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0 space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Goal name</Label>
                    <Input className="h-8" value={goalName} onChange={(e) => setGoalName(e.target.value)} />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Goal amount (₹)</Label>
                      <Input className="h-8" type="number" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Monthly contribution (₹)</Label>
                      <Input
                        className={cn('h-8', contributionError && 'border-destructive focus-visible:ring-destructive')}
                        type="number"
                        min={1}
                        max={Number(goalAmount) > 0 ? goalAmount : undefined}
                        value={monthlyContribution}
                        onChange={(e) => setMonthlyContribution(e.target.value)}
                      />
                      {contributionError && (
                        <p className="text-[11px] text-destructive">{contributionError}</p>
                      )}
                      {!contributionError && Number(goalAmount) > 0 && Number(monthlyContribution) > 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          Max: ₹{Number(goalAmount).toLocaleString('en-IN')} (your goal amount)
                        </p>
                      )}
                    </div>
                  </div>

                  {recommendation && Number(goalAmount) > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/80 dark:bg-amber-950/20 dark:border-amber-800/40 p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1 min-w-0">
                          <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                            Recommended: ₹{recommendation.amount.toLocaleString('en-IN')}/month
                          </p>
                          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                            At this rate you&apos;d reach your goal in about {recommendation.monthsToGoal} months
                            ({recommendation.yearsToGoal} years).
                            {recommendation.cappedByBudget
                              ? ' Adjusted to fit ~35% of your available monthly budget.'
                              : ` A comfortable timeline for a ${activePlanner.label.toLowerCase()} goal.`}
                          </p>
                        </div>
                      </div>
                      {Number(monthlyContribution) !== recommendation.amount && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleUseRecommended}>
                          Use recommended amount
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={handleCalculatePlan} disabled={!!contributionError}>
                      Calculate plan
                    </Button>
                    {showLoanOptions && (
                      <Button size="sm" variant="outline" onClick={handleGetLoanOffers} disabled={loadingOffers || !!contributionError}>
                        <Banknote className="h-3.5 w-3.5 mr-1" />
                        {loadingOffers ? 'Loading...' : 'Bank loan options'}
                      </Button>
                    )}
                  </div>

                  {contributionPlan && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                      {[
                        ['Goal amount', `₹${Number(goalAmount).toLocaleString('en-IN')}`],
                        ['Monthly contribution', `₹${contributionPlan.monthlyContribution.toLocaleString('en-IN')}`],
                        ['Amount to save', `₹${contributionPlan.amountRemaining.toLocaleString('en-IN')}`],
                        ['Time to achieve', contributionPlan.monthsRemaining === 0
                          ? 'Already funded'
                          : `${contributionPlan.monthsRemaining} months (${contributionPlan.yearsRemaining} years)`],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between text-xs border-b border-primary/10 pb-1.5">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-semibold">{value}</span>
                        </div>
                      ))}
                      {contributionPlan.monthsRemaining > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Estimated date: {formatDate(contributionPlan.estimatedDate.toISOString())}
                        </p>
                      )}
                      {recommendation && contributionPlan.monthsRemaining > recommendation.monthsToGoal && (
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Tip: Contributing ₹{recommendation.amount.toLocaleString('en-IN')}/month would get you there
                          {' '}{contributionPlan.monthsRemaining - recommendation.monthsToGoal} months sooner.
                        </p>
                      )}
                      <Button size="sm" className="h-8 w-full" onClick={handleSaveGoal} disabled={createMutation.isPending}>
                        Save {activePlanner.label.toLowerCase()} goal
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-3">
                <p className="text-sm font-medium">Your {activePlanner.label.toLowerCase()} goals</p>
                {plannerGoals.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center rounded-lg border">
                    No {activePlanner.label.toLowerCase()} goals yet. Calculate a plan and save it.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {plannerGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        onEdit={openEditGoal}
                        onDelete={handleDeleteGoal}
                        onAddProgress={handleAddProgress}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <Dialog open={loanOffersOpen} onOpenChange={setLoanOffersOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-primary" />
                Bank loan options for {activePlanner.label}
              </DialogTitle>
              <DialogDescription>
                Banks that may finance your {activePlanner.label.toLowerCase()} goal at rates below {REFERENCE_LOAN_RATE}% p.a.,
                based on ₹{Number(goalAmount).toLocaleString('en-IN')} loan and ₹{Number(monthlyContribution).toLocaleString('en-IN')}/month payment.
              </DialogDescription>
            </DialogHeader>

            {loadingOffers ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Finding loan options...</p>
            ) : loanOffers ? (
              <div className="space-y-4">
                {loanOffers.offers.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Lower-rate options</p>
                    {loanOffers.offers.map((offer) => (
                      <div key={offer.bankName} className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm">{offer.bankName}</p>
                            <p className="text-xs text-muted-foreground">{offer.processingFee}</p>
                          </div>
                          <Badge variant="success" className="shrink-0">
                            {offer.interestRate}% p.a.
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                          <span className="text-muted-foreground">Loan tenure</span>
                          <span className="text-right font-medium">{offer.tenureMonths} mo ({offer.tenureYears} yr)</span>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <TrendingDown className="h-3 w-3 text-green-600" />
                            Interest savings
                          </span>
                          <span className="text-right font-medium text-green-700">₹{offer.formatted.interestSavings}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {offer.highlights.map((h) => (
                            <Badge key={h} variant="secondary" className="text-[10px]">{h}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No banks found below {REFERENCE_LOAN_RATE}%. See all lenders below.
                  </p>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">All participating banks</p>
                  <div className="rounded-lg border divide-y">
                    {loanOffers.allBanks.map((bank) => (
                      <div key={bank.bankName} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span>{bank.bankName}</span>
                        <span className={cn(
                          'font-medium',
                          bank.isLowerThanCurrent ? 'text-green-700' : 'text-muted-foreground',
                        )}>
                          {bank.interestRate}% p.a.
                          {bank.isLowerThanCurrent && ' ✓'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground">
                  Rates are indicative. Combine savings with a loan to reach your goal faster. Final eligibility depends on credit score and income.
                </p>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
