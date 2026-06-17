'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/lib/api';
import { Activity, FileText, Lightbulb, Receipt } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: () => adminApi.analytics(30),
  });

  const analytics = data as {
    signups?: { date: string; count: number }[];
    revenue?: { date: string; amount: string }[];
    totalExpensesTracked?: number;
    totalExpenseVolume?: string;
    reportsGenerated?: number;
    aiInsightsGenerated?: number;
    topEvents?: { event: string; count: number }[];
  } | undefined;

  return (
    <>
      <Header title="Analytics" description="Platform usage and growth metrics" />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Expenses Tracked" value={String(analytics?.totalExpensesTracked ?? 0)} icon={Receipt} subtitle="Last 30 days" />
          <StatCard title="Expense Volume" value={`₹${analytics?.totalExpenseVolume ?? '0'}`} icon={Activity} subtitle="Last 30 days" />
          <StatCard title="Reports Generated" value={String(analytics?.reportsGenerated ?? 0)} icon={FileText} subtitle="Last 30 days" />
          <StatCard title="Money notes" value={String(analytics?.aiInsightsGenerated ?? 0)} icon={Lightbulb} subtitle="Last 30 days" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>User Signups</CardTitle></CardHeader>
            <CardContent className="h-64">
              {isLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.signups ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(analytics?.revenue ?? []).map((r) => ({ ...r, amount: parseFloat(r.amount) }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {analytics?.topEvents && analytics.topEvents.length > 0 && (
          <Card className="mt-6">
            <CardHeader><CardTitle>Top Events</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.topEvents.map((e) => (
                  <div key={e.event} className="flex items-center justify-between rounded-lg border px-4 py-2">
                    <span className="font-mono text-sm">{e.event}</span>
                    <span className="font-semibold">{e.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
