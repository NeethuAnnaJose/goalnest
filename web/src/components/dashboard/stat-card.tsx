import { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

import { cn } from '@/lib/utils';



export type StatCardVariant = 'income' | 'expense' | 'savings' | 'wallet';



const VARIANT_STYLES: Record<StatCardVariant, { icon: string; bar: string }> = {

  income: {

    icon: 'stat-accent-income',

    bar: 'from-emerald-500 to-emerald-400',

  },

  expense: {

    icon: 'stat-accent-expense',

    bar: 'from-rose-500 to-rose-400',

  },

  savings: {

    icon: 'stat-accent-savings',

    bar: 'from-sky-500 to-sky-400',

  },

  wallet: {

    icon: 'stat-accent-wallet',

    bar: 'from-violet-500 to-violet-400',

  },

};



interface StatCardProps {

  title: string;

  value: string;

  subtitle?: string;

  icon: LucideIcon;

  variant?: StatCardVariant;

  className?: string;

}



export function StatCard({

  title,

  value,

  subtitle,

  icon: Icon,

  variant = 'wallet',

  className,

}: StatCardProps) {

  const styles = VARIANT_STYLES[variant];



  return (

    <Card className={cn('group overflow-hidden transition-all duration-200 hover:shadow-card-hover', className)}>

      <div className={cn('h-1 w-full bg-gradient-to-r', styles.bar)} />

      <CardContent className="p-5">

        <div className="flex items-start justify-between gap-3">

          <div className="min-w-0 space-y-1">

            <p className="text-sm font-medium text-muted-foreground">{title}</p>

            <p className="font-display text-2xl font-bold tabular-nums tracking-tight">{value}</p>

            {subtitle && (

              <p className="text-xs text-muted-foreground">{subtitle}</p>

            )}

          </div>

          <div className={cn('rounded-xl p-3 transition-transform duration-200 group-hover:scale-105', styles.icon)}>

            <Icon className="h-5 w-5" />

          </div>

        </div>

      </CardContent>

    </Card>

  );

}

