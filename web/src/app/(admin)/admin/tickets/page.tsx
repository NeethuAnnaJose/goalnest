'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { DataTable } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/lib/api';
import type { AdminTicket } from '@/types/api';
import { toast } from 'sonner';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  OPEN: 'destructive',
  IN_PROGRESS: 'default',
  RESOLVED: 'secondary',
  CLOSED: 'outline',
};

export default function AdminTicketsPage() {
  const [selected, setSelected] = useState<AdminTicket | null>(null);
  const [reply, setReply] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'tickets'],
    queryFn: () => adminApi.tickets(),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => adminApi.replyTicket(id, message),
    onSuccess: () => {
      setReply('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] });
      toast.success('Reply sent');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateTicket(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] });
      toast.success('Ticket updated');
    },
  });

  const columns = [
    {
      key: 'subject',
      header: 'Subject',
      render: (row: AdminTicket) => (
        <button className="text-left font-medium hover:underline" onClick={() => setSelected(row)}>
          {row.subject}
        </button>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (row: AdminTicket) => row.user.email,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row: AdminTicket) => <Badge variant="outline">{row.priority}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: AdminTicket) => (
        <Badge variant={statusColors[row.status] ?? 'outline'}>{row.status}</Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row: AdminTicket) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: AdminTicket) =>
        row.status !== 'RESOLVED' && row.status !== 'CLOSED' ? (
          <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: row.id, status: 'RESOLVED' })}>
            Resolve
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <Header title="Support Tickets" description={`${data?.total ?? 0} tickets`} />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <DataTable columns={columns} data={data?.tickets ?? []} keyField="id" emptyMessage="No support tickets" />
            )}
          </div>

          {selected && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{selected.subject}</CardTitle>
                <p className="text-sm text-muted-foreground">{selected.user.email}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{selected.description}</p>
                {(selected.messages ?? []).map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg p-3 text-sm ${m.isStaff ? 'bg-primary/10' : 'bg-muted'}`}
                  >
                    <p className="text-xs text-muted-foreground mb-1">{m.isStaff ? 'Staff' : 'User'}</p>
                    {m.message}
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a reply..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <Button
                    disabled={!reply.trim()}
                    onClick={() => replyMutation.mutate({ id: selected.id, message: reply })}
                  >
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
