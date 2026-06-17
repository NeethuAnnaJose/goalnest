'use client';



import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { Checkbox } from '@/components/ui/checkbox';

import { cn } from '@/lib/utils';



interface SelectableListRowProps {

  selected?: boolean;

  onSelectChange?: (checked: boolean) => void;

  onActivate?: () => void;

  onDelete?: (e: React.MouseEvent) => void;

  children: React.ReactNode;

  className?: string;

  deleteDisabled?: boolean;

  selectionMode?: boolean;

}



export function SelectableListRow({

  selected = false,

  onSelectChange,

  onActivate,

  onDelete,

  children,

  className,

  deleteDisabled,

  selectionMode = false,

}: SelectableListRowProps) {

  return (

    <div

      className={cn(

        'flex items-center gap-2 rounded-xl border bg-card p-3 shadow-sm transition-all duration-200 sm:p-4',

        selectionMode || onActivate ? 'hover:border-primary/30 hover:shadow-card-hover' : '',

        selected && 'border-primary/40 bg-primary/5 shadow-card-hover ring-1 ring-primary/10',

        className,

      )}

    >

      {selectionMode && onSelectChange && (

        <Checkbox

          checked={selected}

          onCheckedChange={onSelectChange}

          onClick={(e) => e.stopPropagation()}

          aria-label="Select item"

        />

      )}

      <div

        role={onActivate ? 'button' : undefined}

        tabIndex={onActivate ? 0 : undefined}

        onClick={onActivate}

        onKeyDown={onActivate ? (e) => e.key === 'Enter' && onActivate() : undefined}

        className={cn('min-w-0 flex-1', onActivate && 'cursor-pointer')}

      >

        {children}

      </div>

      {onDelete && (

        <Button

          variant="ghost"

          size="icon"

          className="h-8 w-8 shrink-0 rounded-lg hover:bg-destructive/10"

          title="Delete"

          disabled={deleteDisabled}

          onClick={onDelete}

        >

          <Trash2 className="h-4 w-4 text-destructive" />

        </Button>

      )}

    </div>

  );

}

