'use client';

import { useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BulkSelectToolbarProps {
  totalCount: number;
  selectedCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onDeleteSelected: () => void;
  deleting?: boolean;
  itemLabel?: string;
}

export function BulkSelectToolbar({
  totalCount,
  selectedCount,
  allSelected,
  onToggleAll,
  onDeleteSelected,
  deleting,
  itemLabel = 'items',
}: BulkSelectToolbarProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);
  const someSelected = selectedCount > 0 && !allSelected;

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  if (totalCount === 0) return null;

  const singleLabel = itemLabel.endsWith('s') ? itemLabel.slice(0, -1) : itemLabel;

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/15 bg-gradient-to-r from-primary/5 via-card to-card px-3 py-2.5 shadow-sm">
      <label
        className={cn(
          'inline-flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1 transition-colors hover:bg-primary/5',
          (allSelected || someSelected) && 'text-primary',
        )}
      >
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={allSelected}
          onChange={onToggleAll}
          className="h-4 w-4 cursor-pointer rounded border-2 border-primary/40 accent-primary"
          aria-label={allSelected ? 'Deselect all' : 'Select all'}
        />
        <span className="text-sm font-medium">
          {allSelected ? 'Deselect all' : 'Select all'}
        </span>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
          {totalCount}
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-2">
        {selectedCount > 0 ? (
          <>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {selectedCount} {selectedCount === 1 ? singleLabel : itemLabel} selected
            </span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-8 gap-1.5 rounded-lg px-3 text-xs"
              disabled={deleting}
              onClick={onDeleteSelected}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? 'Deleting...' : selectedCount > 1 ? `Delete (${selectedCount})` : 'Delete'}
            </Button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Tap items to select, or use select all</span>
        )}
      </div>
    </div>
  );
}
