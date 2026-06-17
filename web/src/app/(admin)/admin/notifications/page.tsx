'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { DataTable } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/lib/api';
import type { AdminNotification } from '@/types/api';
import { toast } from 'sonner';

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: () => adminApi.notifications(),
  });

  const broadcastMutation = useMutation({
    mutationFn: () =>
      adminApi.broadcast({
        type: 'SYSTEM',
        channel: 'IN_APP',
        title,
        body,
      }),
    onSuccess: (result: { sent: number }) => {
      setTitle('');
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
      toast.success(`Broadcast sent to ${result.sent} users`);
    },
  });

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (row: AdminNotification) => row.user.email,
    },
    {
      key: 'type',
      header: 'Type',
      render: (row: AdminNotification) => <Badge variant="outline">{row.type}</Badge>,
    },
    { key: 'title', header: 'Title' },
    {
      key: 'isRead',
      header: 'Read',
      render: (row: AdminNotification) => (
        <Badge variant={row.isRead ? 'secondary' : 'default'}>{row.isRead ? 'Read' : 'Unread'}</Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Sent',
      render: (row: AdminNotification) => new Date(row.createdAt).toLocaleString(),
    },
  ];

  return (
    <>
      <Header title="Notification Management" description="View and broadcast notifications" />
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Broadcast Notification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-w-lg">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="System announcement" />
            </div>
            <div>
              <Label htmlFor="body">Message</Label>
              <Input id="body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Your message to all users" />
            </div>
            <Button
              disabled={!title.trim() || !body.trim()}
              onClick={() => broadcastMutation.mutate()}
            >
              Broadcast to All Users
            </Button>
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Recent Notifications ({data?.total ?? 0})</h2>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <DataTable columns={columns} data={data?.notifications ?? []} keyField="id" />
          )}
        </div>
      </div>
    </>
  );
}
