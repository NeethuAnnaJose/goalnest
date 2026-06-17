import Link from 'next/link';
import { GoalNestLogo } from '@/components/brand/goalnest-logo';

export function AuthLayout({ children, title, subtitle }: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 p-12 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 80%, rgba(52,211,153,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(45,212,191,0.3) 0%, transparent 50%)',
          }}
        />

        <Link href="/" className="relative z-10">
          <GoalNestLogo size="lg" className="[&_p]:text-white [&_p:last-child]:text-emerald-200/80" />
        </Link>

        <div className="relative z-10">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight">
            Salary, bills, savings,
            <br />
            all in one place
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-emerald-100/90">
            Log your income and spending, track EMIs, set savings goals, and see how much you can
            actually spend this month.
          </p>
        </div>

        <p className="relative z-10 text-sm text-emerald-300/70">© 2026 GoalNest</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden">
            <Link href="/">
              <GoalNestLogo size="md" />
            </Link>
          </div>
          <div className="rounded-2xl border bg-card p-8 shadow-card lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <div className="mb-8">
              <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
              <p className="mt-1.5 text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
