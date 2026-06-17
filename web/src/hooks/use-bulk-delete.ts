'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { deleteSelectedItems } from '@/lib/bulk-delete';
import { getErrorMessage } from '@/lib/api/client';
import { useConfirmDelete } from '@/hooks/use-confirm-delete';

export function useBulkDelete(options: {
  deleteFn: (id: string) => Promise<unknown>;
  itemLabel?: string;
  onSuccess?: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const { confirmBulkDelete } = useConfirmDelete();
  const itemLabel = options.itemLabel ?? 'items';

  const deleteSelected = async (ids: string[], clearSelection: () => void) => {
    if (ids.length === 0) return;
    const confirmed = await confirmBulkDelete(ids.length, itemLabel);
    if (!confirmed) return;

    setDeleting(true);
    try {
      const { succeeded, failed } = await deleteSelectedItems(ids, options.deleteFn);
      clearSelection();
      options.onSuccess?.();
      if (failed === 0) {
        toast.success(`Deleted ${succeeded} ${succeeded === 1 ? itemLabel.replace(/s$/, '') : itemLabel}`);
      } else {
        toast.error(`Deleted ${succeeded}, failed to delete ${failed}`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return { deleteSelected, deleting };
}
