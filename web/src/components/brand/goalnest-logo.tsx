import Image from 'next/image';

import { cn } from '@/lib/utils';



const SIZES = {

  sm: { img: 28, text: 'text-base', tag: 'text-[9px]' },

  md: { img: 36, text: 'text-lg', tag: 'text-[10px]' },

  lg: { img: 44, text: 'text-2xl', tag: 'text-xs' },

} as const;



interface GoalNestLogoProps {

  size?: keyof typeof SIZES;

  showText?: boolean;

  className?: string;

}



export function GoalNestLogo({ size = 'md', showText = true, className }: GoalNestLogoProps) {

  const s = SIZES[size];



  return (

    <div className={cn('flex items-center gap-2.5', className)}>

      <div

        className="relative shrink-0 overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5 dark:ring-white/10"

        style={{ width: s.img, height: s.img }}

      >

        <Image

          src="/goalnest-logo.png"

          alt="GoalNest"

          width={s.img}

          height={s.img}

          className="object-cover"

          priority

        />

      </div>

      {showText && (

        <div className="min-w-0 leading-tight">

          <p className={cn('font-display font-bold tracking-tight text-foreground', s.text)}>GoalNest</p>

          <p className={cn('font-medium text-muted-foreground', s.tag)}>Personal finance</p>

        </div>

      )}

    </div>

  );

}

