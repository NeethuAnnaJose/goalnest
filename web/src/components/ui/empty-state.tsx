import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-xl border border-dashed border-primary/20 bg-gradient-to-b from-muted/40 to-muted/10 px-6 py-12 text-center',
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shadow-sm ring-1 ring-primary/10">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <p className="font-display font-semibold">{title}</p>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className={cn(buttonVariants({ size: 'sm' }), 'mt-5')}>
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <Button size="sm" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
