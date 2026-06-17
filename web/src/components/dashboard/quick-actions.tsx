import Link from 'next/link';

import { Plus } from 'lucide-react';

import { mainNavItems } from '@/lib/navigation';



const actionHrefs = [

  '/expenses',

  '/income',

  '/savings',

  '/goals',

  '/affordability',

  '/reports',

] as const;



const actions = actionHrefs.map((href) => {

  const item = mainNavItems.find((n) => n.href === href)!;

  return { href: item.href, label: item.label, icon: item.icon };

});



export function QuickActions() {

  return (

    <div className="space-y-3">

      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quick actions</p>

      <div className="flex flex-wrap gap-2">

        {actions.map(({ href, label, icon: Icon }) => (

          <Link

            key={href}

            href={href}

            className="inline-flex items-center gap-2 rounded-xl border bg-card px-3.5 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-accent hover:text-foreground hover:shadow-card-hover"

          >

            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">

              <Icon className="h-3.5 w-3.5 text-primary" />

            </span>

            {label}

          </Link>

        ))}

        <Link

          href="/expenses"

          className="inline-flex items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3.5 py-2 text-sm font-semibold text-primary transition-all duration-200 hover:bg-primary/10 hover:shadow-sm"

        >

          <Plus className="h-4 w-4" />

          Add expense

        </Link>

      </div>

    </div>

  );

}

