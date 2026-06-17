'use client';

import { useCallback } from 'react';
import { useConfirm } from '@/providers/confirm-provider';

function formatItemLabel(count: number, itemLabel: string) {
  if (count === 1) {
    if (itemLabel.endsWith('ies')) return itemLabel.slice(0, -3) + 'y';
    if (itemLabel.endsWith('s')) return itemLabel.slice(0, -1);
    return itemLabel;
  }
  return itemLabel;
}

export function useConfirmDelete() {
  const { confirm } = useConfirm();

  const confirmDelete = useCallback(
    async (itemLabel = 'this item') =>
      confirm({
        title: 'Delete item?',
        description: `Delete ${itemLabel}? This cannot be undone.`,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        variant: 'destructive',
      }),
    [confirm],
  );

  const confirmBulkDelete = useCallback(
    async (count: number, itemLabel = 'items') =>
      confirm({
        title: count === 1 ? 'Delete item?' : `Delete ${count} items?`,
        description: `Delete ${count} selected ${formatItemLabel(count, itemLabel)}? This cannot be undone.`,
        confirmLabel: count === 1 ? 'Delete' : `Delete ${count}`,
        cancelLabel: 'Cancel',
        variant: 'destructive',
      }),
    [confirm],
  );

  return { confirmDelete, confirmBulkDelete };
}
