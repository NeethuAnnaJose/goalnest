import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  ArrowUpCircle,
  Receipt,
  PiggyBank,
  Target,
  Landmark,
  ShoppingCart,
  FileText,
  Bell,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Single source of truth for app navigation labels */
export const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/income', label: 'Salary', icon: ArrowUpCircle },
  { href: '/expenses', label: 'Spending', icon: Receipt },
  { href: '/savings', label: 'Savings', icon: PiggyBank },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/loans', label: 'Loans & EMIs', icon: Landmark },
  { href: '/affordability', label: 'Affordability', icon: ShoppingCart },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/notifications', label: 'Alerts', icon: Bell },
];

export function navLabel(href: string): string {
  return mainNavItems.find((n) => n.href === href)?.label ?? href;
}
