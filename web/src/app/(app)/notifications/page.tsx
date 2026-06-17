'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BulkSelectToolbar } from '@/components/ui/bulk-select-toolbar';
import { Checkbox } from '@/components/ui/checkbox';
import { notificationsApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/api/client';
import { useConfirmDelete } from '@/hooks/use-confirm-delete';
import { useBulkDelete } from '@/hooks/use-bulk-delete';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { formatDate } from '@/lib/format';
import type { Notification } from '@/types/api';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { confirmDelete } = useConfirmDelete();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
  });

  const notificationIds = useMemo(() => (notifications ?? []).map((n) => n.id), [notifications]);
  const notificationSelection = useBulkSelection(notificationIds);
  const { deleteSelected: deleteSelectedNotifications, deleting: bulkDeleting } = useBulkDelete({
    deleteFn: (id) => notificationsApi.delete(id),
    itemLabel: 'notifications',
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleOpen = (n: Notification) => {
    if (!n.isRead) markReadMutation.mutate(n.id);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (await confirmDelete('this notification')) deleteMutation.mutate(id);
  };

  return (
    <>
      <Header title="Alerts" description="Budget, bill, and goal notifications" />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-4 flex justify-end">
          <Button variant="outline" onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (notifications ?? []).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16">
              <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No notifications yet.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <BulkSelectToolbar
              totalCount={notificationSelection.totalCount}
              selectedCount={notificationSelection.selectedCount}
              allSelected={notificationSelection.allSelected}
              onToggleAll={notificationSelection.toggleAll}
              onDeleteSelected={() =>
                deleteSelectedNotifications(notificationSelection.selectedIds, notificationSelection.clear)
              }
              deleting={bulkDeleting || deleteMutation.isPending}
              itemLabel="notifications"
            />
            <div className="space-y-3">
            {(notifications ?? []).map((n) => (
              <Card
                key={n.id}
                className={`cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/30 ${
                  !n.isRead ? 'border-primary/30 bg-primary/5' : ''
                } ${notificationSelection.isSelected(n.id) ? 'border-primary/40 bg-primary/5' : ''}`}
                onClick={() => handleOpen(n)}
              >
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <Checkbox
                    checked={notificationSelection.isSelected(n.id)}
                    onCheckedChange={() => notificationSelection.toggle(n.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{n.title}</p>
                      {!n.isRead && <Badge>New</Badge>}
                      <Badge variant="secondary">{n.type.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(n.createdAt)}</p>
                    {!n.isRead && (
                      <p className="mt-1 text-[10px] text-muted-foreground">Click to mark as read</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    title="Delete notification"
                    onClick={(e) => handleDelete(n.id, e)}
                    disabled={deleteMutation.isPending || bulkDeleting}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
