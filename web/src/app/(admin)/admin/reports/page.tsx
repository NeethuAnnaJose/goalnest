'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { DataTable } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/lib/api';

export default function AdminReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => adminApi.reports(),
  });

  const reports = (data as { reports?: Array<Record<string, unknown>> })?.reports ?? [];

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (row: Record<string, unknown>) => {
        const user = row.user as { email: string };
        return user?.email ?? '-';
      },
    },
    {
      key: 'period',
      header: 'Period',
      render: (row: Record<string, unknown>) => <Badge variant="outline">{String(row.period)}</Badge>,
    },
    {
      key: 'format',
      header: 'Format',
      render: (row: Record<string, unknown>) => <Badge>{String(row.format)}</Badge>,
    },
    {
      key: 'createdAt',
      header: 'Generated',
      render: (row: Record<string, unknown>) => new Date(String(row.createdAt)).toLocaleString(),
    },
  ];

  return (
    <>
      <Header title="Reports" description="All user-generated financial reports" />
      <div className="flex-1 overflow-y-auto p-8">
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <DataTable columns={columns} data={reports} keyField="id" emptyMessage="No reports generated yet" />
        )}
      </div>
    </>
  );
}
