'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { DataTable } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/lib/api';
import type { AdminSubscription, AdminPlan } from '@/types/api';

export default function AdminSubscriptionsPage() {
  const { data: subs } = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: () => adminApi.subscriptions(),
  });

  const { data: plans } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => adminApi.plans(),
  });

  const subColumns = [
    {
      key: 'user',
      header: 'User',
      render: (row: AdminSubscription) => row.user.email,
    },
    { key: 'name', header: 'Subscription' },
    { key: 'provider', header: 'Provider' },
    {
      key: 'amountMajor',
      header: 'Amount',
      render: (row: AdminSubscription) => `₹${row.amountMajor}`,
    },
    {
      key: 'renewalDate',
      header: 'Renewal',
      render: (row: AdminSubscription) => new Date(row.renewalDate).toLocaleDateString(),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row: AdminSubscription) => (
        <Badge variant={row.isActive ? 'default' : 'secondary'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <Header title="Subscriptions" description="User subscriptions and plan tiers" />
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        <div>
          <h2 className="mb-3 text-lg font-semibold">Subscription Plans</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {(plans ?? []).map((plan: AdminPlan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    <Badge>{plan.tier}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    ₹{Number(plan.priceMonthly) / 100}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Active User Subscriptions ({subs?.total ?? 0})</h2>
          <DataTable columns={subColumns} data={subs?.subscriptions ?? []} keyField="id" />
        </div>
      </div>
    </>
  );
}
