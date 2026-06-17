'use client';



import { useMemo } from 'react';

import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';

import {

  ArrowDownCircle,

  ArrowUpCircle,

  PiggyBank,

  Landmark,

  Wallet,

  Target,

} from 'lucide-react';

import {

  BarChart,

  Bar,

  XAxis,

  YAxis,

  CartesianGrid,

  Tooltip,

  ResponsiveContainer,

} from 'recharts';

import { Header } from '@/components/layout/header';

import { StatCard } from '@/components/dashboard/stat-card';

import { QuickActions } from '@/components/dashboard/quick-actions';

import { AiCoachTips } from '@/components/dashboard/ai-coach-tips';

import { HealthScoreRing } from '@/components/dashboard/health-score-ring';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Progress } from '@/components/ui/progress';

import { Skeleton } from '@/components/ui/skeleton';

import { EmptyState } from '@/components/ui/empty-state';

import { buttonVariants } from '@/components/ui/button';

import { dashboardApi, expensesApi } from '@/lib/api';

import { previousMonthKey } from '@/lib/financial-year';

import { firstName, getTimeGreeting } from '@/lib/greeting';

import { useAuth } from '@/providers/auth-provider';

import { useFinancialYear } from '@/providers/financial-year-provider';

import { cn } from '@/lib/utils';



function buildSpendingInsight(

  current: { name: string; amount: number }[],

  previous: { category: string; amount: string | number }[] | undefined,

): string | null {

  if (current.length === 0) return null;



  const prevMap = new Map(

    (previous ?? []).map((b) => [b.category.replace(/_/g, ' '), Number(b.amount) / 100]),

  );



  let topIncrease = { name: '', pct: 0 };

  for (const item of current) {

    const prev = prevMap.get(item.name) ?? 0;

    if (prev > 0 && item.amount > prev) {

      const pct = Math.round(((item.amount - prev) / prev) * 100);

      if (pct > topIncrease.pct) topIncrease = { name: item.name, pct };

    }

  }



  if (topIncrease.pct > 0) {

    return `${topIncrease.pct}% more on ${topIncrease.name} than last month.`;

  }



  const thisTotal = current.reduce((s, c) => s + c.amount, 0);

  const prevTotal = Array.from(prevMap.values()).reduce((s, v) => s + v, 0);

  if (prevTotal > 0) {

    const pct = Math.round(((thisTotal - prevTotal) / prevTotal) * 100);

    if (pct > 5) return `Spending up ${pct}% vs last month.`;

    if (pct < -5) return `Spending down ${Math.abs(pct)}% vs last month.`;

  }



  const top = [...current].sort((a, b) => b.amount - a.amount)[0];

  return top ? `Top category: ${top.name}.` : null;

}



export default function DashboardPage() {

  const { user } = useAuth();

  const { financialYear, financialYearLabel, activeMonth, isReady } = useFinancialYear();

  const month = activeMonth;

  const prevMonth = previousMonthKey(month);



  const { data: dashboard, isLoading } = useQuery({

    queryKey: ['dashboard', financialYear],

    queryFn: () => dashboardApi.get(financialYear!),

    enabled: isReady && !!financialYear,

  });



  const { data: breakdown } = useQuery({

    queryKey: ['expenses', 'breakdown', financialYear, month],

    queryFn: () => expensesApi.breakdown({ month }),

    enabled: isReady && !!financialYear,

  });



  const { data: prevBreakdown } = useQuery({

    queryKey: ['expenses', 'breakdown', financialYear, prevMonth],

    queryFn: () => expensesApi.breakdown({ month: prevMonth }),

    enabled: isReady && !!financialYear,

  });



  const chartData = useMemo(

    () =>

      (breakdown ?? []).map((b) => ({

        name: b.category.replace(/_/g, ' '),

        amount: Number(b.amount) / 100,

      })),

    [breakdown],

  );



  const spendingInsight = useMemo(

    () => buildSpendingInsight(chartData, prevBreakdown),

    [chartData, prevBreakdown],

  );



  if (isLoading) {

    return (

      <>

        <Header title="Overview" />

        <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-4">

          {Array.from({ length: 4 }).map((_, i) => (

            <Skeleton key={i} className="h-28 rounded-lg" />

          ))}

        </div>

      </>

    );

  }



  const f = dashboard?.formatted;

  const name = firstName(user?.name);

  const safeToSpend = f?.safeToSpend ?? '0';



  return (

    <>

      <Header

        title={`${getTimeGreeting()}, ${name}`}

        description={`${financialYearLabel} · ₹${safeToSpend} safe to spend`}

      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        <QuickActions />



        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

          <StatCard

            title="Salary"

            value={`₹${f?.monthlyIncome ?? '0'}`}

            icon={ArrowUpCircle}

            variant="income"

            subtitle={`This month · FY ₹${f?.fyIncome ?? '0'}`}

          />

          <StatCard

            title="Spending"

            value={`₹${f?.monthlyExpenses ?? '0'}`}

            icon={ArrowDownCircle}

            variant="expense"

            subtitle={`This month · FY ₹${f?.fyExpenses ?? '0'}`}

          />

          <StatCard

            title="My Savings"

            value={`₹${f?.currentSavings ?? '0'}`}

            icon={PiggyBank}

            variant="savings"

            subtitle="All accounts"

          />

          <StatCard

            title="Safe to Spend"

            value={`₹${safeToSpend}`}

            icon={Wallet}

            variant="wallet"

            subtitle="After bills & EMIs"

          />

        </div>



        <div className="grid gap-6 lg:grid-cols-3">

          <Card>

            <CardHeader className="pb-2">

              <CardTitle className="text-base">Financial Health</CardTitle>

            </CardHeader>

            <CardContent className="space-y-4">

              {dashboard?.financialHealthScore && (

                <>

                  <HealthScoreRing

                    score={dashboard.financialHealthScore.score}

                    grade={dashboard.financialHealthScore.grade}

                  />

                  <ul className="space-y-1.5 text-sm text-muted-foreground">

                    {dashboard.financialHealthScore.recommendations.slice(0, 3).map((r, i) => (

                      <li key={i} className="flex gap-2">

                        <span>·</span>

                        <span>{r}</span>

                      </li>

                    ))}

                  </ul>

                </>

              )}

            </CardContent>

          </Card>



          <Card className="lg:col-span-2">

            <CardHeader className="pb-2">

              <CardTitle className="text-base">Where Your Money Goes</CardTitle>

              {spendingInsight && (

                <p className="text-sm text-muted-foreground">{spendingInsight}</p>

              )}

            </CardHeader>

            <CardContent>

              {chartData.length > 0 ? (

                <ResponsiveContainer width="100%" height={220}>

                  <BarChart data={chartData}>

                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />

                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />

                    <YAxis tick={{ fontSize: 11 }} />

                    <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Amount']} />

                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />

                  </BarChart>

                </ResponsiveContainer>

              ) : (

                <EmptyState

                  icon={ArrowDownCircle}

                  title="No expenses yet"

                  description="Add your first expense to see a breakdown."

                  actionLabel="Add expense"

                  actionHref="/expenses"

                />

              )}

            </CardContent>

          </Card>

        </div>



        <AiCoachTips />

        <div className="grid gap-6 lg:grid-cols-2">

          <Card>

            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">

              <CardTitle className="text-base">Goals</CardTitle>

              {(dashboard?.activeGoals ?? []).length > 0 && (
                <Link
                  href="/goals"
                  className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-7 text-xs')}
                >
                  View all
                </Link>
              )}

            </CardHeader>

            <CardContent className="space-y-4">

              {(dashboard?.activeGoals ?? []).slice(0, 4).map((goal) => (

                <div key={goal.id} className="space-y-2">

                  <div className="flex justify-between text-sm">

                    <span className="font-medium">{goal.name}</span>

                    <span className="text-muted-foreground">{goal.completionPercent ?? 0}%</span>

                  </div>

                  <Progress value={goal.completionPercent ?? 0} className="h-2" />

                </div>

              ))}

              {(dashboard?.activeGoals ?? []).length === 0 && (

                <EmptyState

                  icon={Target}

                  title="No goals yet"

                  description="Create a goal to track your progress."

                  actionLabel="Add goal"

                  actionHref="/goals"

                />

              )}

            </CardContent>

          </Card>



          <Card>

            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">

              <CardTitle className="text-base">Upcoming EMIs</CardTitle>

              {(dashboard?.upcomingEmis ?? []).length > 0 && (
                <Link
                  href="/loans"
                  className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-7 text-xs')}
                >
                  View all
                </Link>
              )}

            </CardHeader>

            <CardContent className="space-y-3">

              {(dashboard?.upcomingEmis ?? []).slice(0, 5).map((emi) => (

                <div

                  key={emi.id}

                  className="flex items-center justify-between rounded-xl border bg-muted/20 p-3.5 transition-colors hover:bg-muted/40"

                >

                  <div>

                    <p className="text-sm font-medium">{emi.loan?.name ?? 'Loan'}</p>

                    <p className="text-xs text-muted-foreground">

                      {new Date(emi.dueDate).toLocaleDateString('en-IN', {

                        day: 'numeric',

                        month: 'short',

                      })}

                    </p>

                  </div>

                  <p className="font-semibold tabular-nums">

                    ₹{emi.amountMajor ?? Number(emi.amount) / 100}

                  </p>

                </div>

              ))}

              {(dashboard?.upcomingEmis ?? []).length === 0 && (

                <EmptyState

                  icon={Landmark}

                  title="No EMIs due soon"

                  description="No payments due in the next 30 days."

                  actionLabel="Add loan"

                  actionHref="/loans"

                />

              )}

            </CardContent>

          </Card>

        </div>

      </div>

    </>

  );

}

