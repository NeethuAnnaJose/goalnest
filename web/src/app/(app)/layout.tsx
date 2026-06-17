'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { TrialBanner } from '@/components/layout/trial-banner';
import { useAuth } from '@/providers/auth-provider';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center app-shell-bg">
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-14 w-14 rounded-2xl" />
          <Skeleton className="mx-auto h-4 w-36" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="app-shell-bg flex flex-1 flex-col overflow-hidden">
        <TrialBanner />
        {children}
      </main>
    </div>
  );
}
