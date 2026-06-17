'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { DataTable } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api';
import type { AdminUser } from '@/types/api';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', search, role],
    queryFn: () => adminApi.users({ search: search || undefined, role: role || undefined }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, planTier }: { id: string; planTier: string }) =>
      adminApi.updateUser(id, { planTier }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User updated');
    },
  });

  const columns = [
    {
      key: 'email',
      header: 'User',
      render: (row: AdminUser) => (
        <div>
          <p className="font-medium">{row.name ?? '-'}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row: AdminUser) => <Badge variant="outline">{row.role}</Badge>,
    },
    {
      key: 'planTier',
      header: 'Plan',
      render: (row: AdminUser) => <Badge>{row.planTier}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: AdminUser) => (
        <Badge variant={row.deletedAt ? 'destructive' : 'default'}>
          {row.deletedAt ? 'Suspended' : 'Active'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (row: AdminUser) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: AdminUser) => (
        <div className="flex gap-1">
          {row.planTier !== 'PREMIUM' && (
            <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: row.id, planTier: 'PREMIUM' })}>
              Upgrade
            </Button>
          )}
          {row.deletedAt ? (
            <Button size="sm" variant="outline" onClick={() => adminApi.updateUser(row.id, { suspended: false }).then(() => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }))}>
              Restore
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => adminApi.updateUser(row.id, { suspended: true }).then(() => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }))}>
              Suspend
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Header title="Users" description={`${data?.total ?? 0} total users`} />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-4 flex gap-3">
          <Input placeholder="Search email or name..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
            <option value="">All roles</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPPORT">Support</option>
          </select>
        </div>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <DataTable columns={columns} data={data?.users ?? []} keyField="id" />
        )}
      </div>
    </>
  );
}
