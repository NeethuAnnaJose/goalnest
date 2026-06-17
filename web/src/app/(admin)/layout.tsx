'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { useAuth } from '@/providers/auth-provider';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'ADMIN' && user.role !== 'SUPPORT') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center app-shell-bg">
        <Skeleton className="h-12 w-48 rounded-xl" />
      </div>
    );
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPPORT')) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <main className="app-shell-bg flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
