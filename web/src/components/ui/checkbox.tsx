'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, onClick, ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      onClick={onClick}
      className={cn(
        'h-4 w-4 shrink-0 cursor-pointer rounded border border-input accent-primary',
        className,
      )}
      {...props}
    />
  ),
);
Checkbox.displayName = 'Checkbox';
