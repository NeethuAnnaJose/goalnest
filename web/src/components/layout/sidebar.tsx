'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Shield, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mainNavItems } from '@/lib/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/providers/theme-provider';
import { Button } from '@/components/ui/button';
import { GoalNestLogo } from '@/components/brand/goalnest-logo';
import { FinancialYearSelector } from '@/components/layout/financial-year-selector';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-card shadow-sm">
      <div className="flex h-16 items-center border-b px-5">
        <GoalNestLogo size="sm" />
      </div>

      <div className="border-b px-4 py-3">
        <FinancialYearSelector />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {(user?.role === 'ADMIN' || user?.role === 'SUPPORT') && (
          <Link
            href="/admin"
            className={cn(
              'mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              pathname.startsWith('/admin')
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Shield className="h-4 w-4 shrink-0" />
            Admin
          </Link>
        )}

        {mainNavItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary-foreground/30" />
              )}
              <Icon className={cn('h-4 w-4 shrink-0', !isActive && 'group-hover:text-primary')} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t p-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user?.name ?? 'User'}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 rounded-lg text-muted-foreground"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 rounded-lg text-muted-foreground hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
