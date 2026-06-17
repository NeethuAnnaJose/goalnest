'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export function useBulkSelection(allIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelected((prev) => {
      const valid = new Set(allIds);
      const next = new Set(Array.from(prev).filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [allIds]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (allIds.length > 0 && allIds.every((id) => prev.has(id))) {
        return new Set();
      }
      return new Set(allIds);
    });
  }, [allIds]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const selectedIds = useMemo(() => Array.from(selected), [selected]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  return {
    selectedIds,
    toggle,
    toggleAll,
    clear,
    isSelected,
    allSelected,
    someSelected,
    selectedCount: selected.size,
    totalCount: allIds.length,
  };
}
