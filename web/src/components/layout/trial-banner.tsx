'use client';

import { Gift } from 'lucide-react';
import { billingConfig } from '@/lib/billing-config';

export function TrialBanner() {
  if (billingConfig.enabled) return null;

  return (
    <div className="flex items-center justify-center gap-2.5 border-b border-emerald-200/60 bg-gradient-to-r from-emerald-50 via-teal-50/80 to-emerald-50 px-4 py-2.5 text-center text-sm dark:border-emerald-900/60 dark:from-emerald-950/60 dark:via-teal-950/40 dark:to-emerald-950/60">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15">
        <Gift className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      </span>
      <span className="text-emerald-800 dark:text-emerald-200">
        <strong className="font-semibold">Early access:</strong> {billingConfig.trialMessage}
      </span>
    </div>
  );
}
