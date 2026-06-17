'use client';

import { SelectableListRow } from '@/components/ui/selectable-list-row';

interface EditableListRowProps {
  onEdit: () => void;
  onDelete: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  className?: string;
  deleteDisabled?: boolean;
  selected?: boolean;
  onSelectChange?: (checked: boolean) => void;
  selectionMode?: boolean;
}

export function EditableListRow({
  onEdit,
  onDelete,
  children,
  className,
  deleteDisabled,
  selected,
  onSelectChange,
  selectionMode,
}: EditableListRowProps) {
  return (
    <SelectableListRow
      selected={selected}
      onSelectChange={onSelectChange}
      onActivate={onEdit}
      onDelete={onDelete}
      className={className}
      deleteDisabled={deleteDisabled}
      selectionMode={selectionMode}
    >
      {children}
    </SelectableListRow>
  );
}
