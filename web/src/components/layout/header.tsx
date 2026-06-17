'use client';



import { useQuery } from '@tanstack/react-query';

import { Bell } from 'lucide-react';

import Link from 'next/link';

import { notificationsApi } from '@/lib/api';

import { Badge } from '@/components/ui/badge';

import { cn } from '@/lib/utils';



interface HeaderProps {

  title: string;

  description?: string;

}



export function Header({ title, description }: HeaderProps) {

  const { data } = useQuery({

    queryKey: ['notifications', 'unread-count'],

    queryFn: () => notificationsApi.unreadCount(),

  });



  const unreadCount = data?.count ?? 0;



  return (

    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-card/80 px-6 backdrop-blur-xl">

      <div className="min-w-0">

        <h1 className="truncate font-display text-xl font-semibold tracking-tight">{title}</h1>

        {description && (

          <p className="truncate text-sm text-muted-foreground">{description}</p>

        )}

      </div>

      <Link

        href="/notifications"

        className={cn(

          'relative shrink-0 rounded-xl p-2.5 transition-all duration-200',

          'hover:bg-accent hover:shadow-sm',

          unreadCount > 0 && 'text-primary',

        )}

        title="Alerts"

      >

        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (

          <Badge className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center px-1 text-[10px]">

            {unreadCount}

          </Badge>

        )}

      </Link>

    </header>

  );

}

