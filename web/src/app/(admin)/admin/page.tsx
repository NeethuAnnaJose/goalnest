'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, UserPlus, LifeBuoy, CreditCard, DollarSign, TrendingUp } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi } from '@/lib/api';

export default function AdminOverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => adminApi.overview(),
  });

  if (isLoading) {
    return (
      <>
        <Header title="Admin Overview" description="Platform management dashboard" />
        <div className="grid gap-4 p-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Admin Overview" description="Platform management dashboard" />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Total Users" value={String(data?.totalUsers ?? 0)} icon={Users} subtitle={`${data?.activeUsers ?? 0} active`} />
          <StatCard title="New This Month" value={String(data?.newUsersThisMonth ?? 0)} icon={UserPlus} subtitle="Signups" />
          <StatCard title="Open Tickets" value={String(data?.openTickets ?? 0)} icon={LifeBuoy} subtitle="Needs attention" />
          <StatCard title="Active Subscriptions" value={String(data?.activeSubscriptions ?? 0)} icon={CreditCard} subtitle="User subscriptions" />
          <StatCard title="Revenue (Month)" value={`₹${data?.revenueThisMonth ?? '0'}`} icon={DollarSign} subtitle="Completed payments" />
          <StatCard title="MRR" value={`₹${data?.mrr ?? '0'}`} icon={TrendingUp} subtitle="Monthly recurring" />
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {(data?.planBreakdown ?? []).map((plan) => (
                <div key={plan.tier} className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">{plan.tier}</p>
                  <p className="text-2xl font-bold">{plan.count}</p>
                  <p className="text-xs text-muted-foreground">users</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
