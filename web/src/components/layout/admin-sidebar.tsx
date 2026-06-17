'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  FileText,
  DollarSign,
  LifeBuoy,
  Bell,
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { GoalNestLogo } from '@/components/brand/goalnest-logo';

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/reports', label: 'Reports', icon: FileText },
  { href: '/admin/revenue', label: 'Revenue', icon: DollarSign },
  { href: '/admin/tickets', label: 'Support Tickets', icon: LifeBuoy },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = (user?.name ?? 'A')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-800/80 bg-slate-950 text-slate-100 shadow-xl">
      <div className="flex h-16 items-center border-b border-slate-800/80 px-5">
        <GoalNestLogo
          size="sm"
          className="[&_p]:text-white [&_p:last-child]:text-slate-400"
        />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/50'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white',
              )}
            >
              <Icon className={cn('h-4 w-4', !isActive && 'group-hover:text-emerald-400')} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-slate-800/80 p-4">
        <Link href="/dashboard">
          <Button variant="ghost" className="w-full justify-start gap-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </Button>
        </Link>
        <div className="flex items-center gap-3 rounded-lg bg-slate-900/80 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-xs font-bold text-emerald-400">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user?.name ?? 'Admin'}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start gap-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
