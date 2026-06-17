'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { DataTable } from '@/components/admin/data-table';
import { StatCard } from '@/components/dashboard/stat-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/lib/api';
import { DollarSign, CreditCard } from 'lucide-react';

export default function AdminRevenuePage() {
  const [period, setPeriod] = useState<'month' | 'year' | 'all'>('month');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'revenue', period],
    queryFn: () => adminApi.revenue(period),
  });

  const revenue = data as {
    total?: string;
    byTier?: { tier: string; count: number; amount: string }[];
    byProvider?: { provider: string; count: number; amount: string }[];
    recentPayments?: Array<Record<string, unknown>>;
  } | undefined;

  const paymentColumns = [
    {
      key: 'user',
      header: 'User',
      render: (row: Record<string, unknown>) => {
        const user = row.user as { email: string };
        return user?.email ?? '-';
      },
    },
    { key: 'amount', header: 'Amount', render: (row: Record<string, unknown>) => `₹${row.amount}` },
    {
      key: 'planTier',
      header: 'Plan',
      render: (row: Record<string, unknown>) => <Badge>{String(row.planTier)}</Badge>,
    },
    { key: 'provider', header: 'Provider' },
    {
      key: 'completedAt',
      header: 'Date',
      render: (row: Record<string, unknown>) =>
        row.completedAt ? new Date(String(row.completedAt)).toLocaleDateString() : '-',
    },
  ];

  return (
    <>
      <Header title="Revenue" description="Payment and subscription revenue" />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-4 flex gap-2">
          {(['month', 'year', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                period === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {p === 'all' ? 'All Time' : `This ${p}`}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <StatCard title="Total Revenue" value={isLoading ? '...' : `₹${revenue?.total ?? '0'}`} icon={DollarSign} subtitle={period} />
          <StatCard
            title="Transactions"
            value={String(revenue?.recentPayments?.length ?? 0)}
            icon={CreditCard}
            subtitle="Recent payments"
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Revenue by Plan</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(revenue?.byTier ?? []).map((t) => (
                <div key={t.tier} className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div>
                    <Badge>{t.tier}</Badge>
                    <p className="mt-1 text-xs text-muted-foreground">{t.count} payments</p>
                  </div>
                  <p className="font-semibold">₹{t.amount}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Revenue by Provider</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(revenue?.byProvider ?? []).map((p) => (
                <div key={p.provider} className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div>
                    <p className="font-medium">{p.provider}</p>
                    <p className="text-xs text-muted-foreground">{p.count} payments</p>
                  </div>
                  <p className="font-semibold">₹{p.amount}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">Recent Payments</h2>
          <DataTable columns={paymentColumns} data={revenue?.recentPayments ?? []} keyField="id" emptyMessage="No payments yet" />
        </div>
      </div>
    </>
  );
}
