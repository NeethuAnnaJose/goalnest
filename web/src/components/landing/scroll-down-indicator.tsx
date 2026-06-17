'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface ScrollDownIndicatorProps {
  targetId?: string;
}

export function ScrollDownIndicator({ targetId = 'features' }: ScrollDownIndicatorProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY < 100);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTarget = () => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTarget}
      aria-label="Scroll down to explore more"
      className="scroll-enter group relative mx-auto mt-5 flex flex-col items-center outline-none"
    >
      <span
        aria-hidden
        className="scroll-glow pointer-events-none absolute left-1/2 top-1/2 h-16 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/30 blur-2xl dark:bg-emerald-500/20"
      />

      <span className="relative inline-flex overflow-hidden rounded-full p-[1.5px] shadow-[0_8px_32px_-8px_rgba(16,185,129,0.5)] transition-transform duration-500 ease-out group-hover:scale-[1.04] group-active:scale-[0.98]">
        <span
          aria-hidden
          className="scroll-border-spin absolute left-1/2 top-1/2 h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0%,#34d399_18%,#2dd4bf_36%,transparent_54%,transparent_100%)]"
        />
        <span
          aria-hidden
          className="scroll-pill-shimmer pointer-events-none absolute inset-0 z-10 rounded-full opacity-40 group-hover:opacity-70"
        />
        <span className="relative z-20 flex items-center gap-3 rounded-full bg-background/90 px-5 py-2.5 backdrop-blur-md dark:bg-background/80">
          <span className="scroll-text-shimmer bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 bg-[length:200%_auto] bg-clip-text text-xs font-semibold tracking-wide text-transparent dark:from-emerald-300 dark:via-teal-300 dark:to-emerald-300">
            Explore below
          </span>
          <span className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
            <span className="flex flex-col items-center -space-y-3">
              <ChevronDown className="scroll-chevron-flow h-3.5 w-3.5 text-white/90" strokeWidth={2.5} />
              <ChevronDown className="scroll-chevron-flow scroll-chevron-flow-delay h-3.5 w-3.5 text-white/50" strokeWidth={2.5} />
            </span>
          </span>
        </span>
      </span>

      <span aria-hidden className="relative mt-3 flex h-5 w-5 items-center justify-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="scroll-ripple absolute inset-0 rounded-full border border-emerald-500/40"
            style={{ animationDelay: `${i * 0.9}s` }}
          />
        ))}
      </span>
    </button>
  );
}
