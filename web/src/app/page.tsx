import Link from 'next/link';
import {
  Target,
  Lightbulb,
  BarChart3,
  PiggyBank,
  ShoppingCart,
  FileText,
  ArrowRight,
  Check,
  Wallet,
  Bell,
  Landmark,
  Gift,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { billingConfig } from '@/lib/billing-config';
import { GoalNestLogo } from '@/components/brand/goalnest-logo';
import { ScrollDownIndicator } from '@/components/landing/scroll-down-indicator';

const features = [
  {
    icon: BarChart3,
    title: 'Dashboard',
    desc: 'Income, expenses, savings, and safe-to-spend in one place.',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  {
    icon: Target,
    title: 'Goals',
    desc: 'Set goals and use planners for house, car, wedding, and more.',
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  },
  {
    icon: ShoppingCart,
    title: 'Affordability',
    desc: 'Check if a purchase fits your budget before you buy.',
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  },
  {
    icon: PiggyBank,
    title: 'Savings',
    desc: 'Track bank accounts, FDs, mutual funds, and cash.',
    color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  },
  {
    icon: Landmark,
    title: 'Loans',
    desc: 'Track loans, EMIs, and upcoming payments.',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  {
    icon: FileText,
    title: 'Reports',
    desc: 'Generate and download financial reports.',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
];

const highlights = [
  'Built for Indian salaries & EMIs',
  'Budget alerts when you overspend',
  'No bank login required to start',
  'Works on phone and desktop',
];

const paidPlans = [
  { name: 'Free', price: '₹0', features: ['3 goals', 'Monthly reports', 'Basic tracking'] },
  {
    name: 'Premium',
    price: '₹499/mo',
    features: ['Unlimited goals', 'Weekly money notes', 'All reports', 'Goal planners'],
    highlight: true,
  },
  { name: 'Family', price: '₹799/mo', features: ['Everything in Premium', '5 family members', 'Shared goals'] },
];

export default function LandingPage() {
  const showPaidPricing = billingConfig.enabled;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/">
            <GoalNestLogo size="md" />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="shadow-sm">Start free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/90 via-background to-background dark:from-emerald-950/40 dark:via-background dark:to-background" />
        <div className="absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-teal-400/8 blur-3xl" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2310b981\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-12 text-center md:pb-24 md:pt-16">
          {billingConfig.launchBadge && (
            <Badge className="mb-6 bg-emerald-600 px-4 py-1.5 text-sm shadow-sm hover:bg-emerald-600">
              {billingConfig.launchBadge}
            </Badge>
          )}
          <h1 className="animate-fade-up font-display text-4xl font-extrabold tracking-tight md:text-6xl md:leading-[1.1]">
            Track your money
            <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent dark:from-emerald-400 dark:via-teal-400 dark:to-emerald-300">
              without the spreadsheet
            </span>
          </h1>
          <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl" style={{ animationDelay: '0.1s' }}>
            Salary, rent, EMIs, savings. See what&apos;s left at the end of the month.
            Built for how people actually manage money in India.
          </p>
          <div className="animate-fade-up mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: '0.2s' }}>
            <Link href="/register">
              <Button size="lg" className="h-12 gap-2 px-8 text-base shadow-lg shadow-primary/25">
                {showPaidPricing ? 'Get started' : 'Start free, no card needed'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                I already have an account
              </Button>
            </Link>
          </div>
          {!showPaidPricing && (
            <p className="mt-4 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {billingConfig.trialMessage}
            </p>
          )}

          <ScrollDownIndicator targetId="features" />

          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {[
              { icon: Wallet, label: 'Track money' },
              { icon: Target, label: 'Plan goals' },
              { icon: Bell, label: 'Budget alerts' },
              { icon: Lightbulb, label: 'Money notes' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2.5 rounded-xl border bg-card/70 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/20 hover:shadow-card-hover"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <span className="text-xs font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/30 py-24 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <p className="section-label mb-3">Features</p>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">All your finances in one app</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Simple tools for tracking, planning, and reporting.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <Card key={title} className="group border-0 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
                <CardContent className="p-6">
                  <div className={`mb-4 inline-flex rounded-xl p-3 transition-transform duration-200 group-hover:scale-105 ${color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why GoalNest */}
      <section className="py-24">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-16 px-6 md:flex-row">
          <div className="flex-1">
            <p className="section-label mb-3">Why GoalNest</p>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Built for Indian salaries and EMIs</h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Most apps only show what you spent last month. GoalNest shows what you can spend
              this month, after rent, bills, and loan payments are accounted for.
            </p>
            <ul className="mt-8 space-y-4">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/10">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <Card className="w-full max-w-md overflow-hidden border-l-4 border-l-primary shadow-elevated">
            <CardContent className="bg-gradient-to-br from-primary/5 to-transparent p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Safe to spend</p>
              <p className="mt-4 font-display text-xl font-semibold leading-snug">
                ₹24,500 left this month after rent, groceries, and your car EMI.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                That number updates as you log expenses, so you&apos;re not guessing on payday.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing / Launch offer */}
      <section className="border-t bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          {showPaidPricing ? (
            <>
              <div className="mb-14 text-center">
                <p className="section-label mb-3">Pricing</p>
                <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Simple, transparent pricing</h2>
                <p className="mt-4 text-muted-foreground">Upgrade when you are ready.</p>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {paidPlans.map((plan) => (
                  <Card key={plan.name} className={plan.highlight ? 'border-primary shadow-elevated ring-1 ring-primary/20' : 'shadow-card'}>
                    <CardContent className="p-6">
                      {plan.highlight && (
                        <Badge className="mb-3">Most popular</Badge>
                      )}
                      <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                      <p className="mt-1 font-display text-3xl font-bold">{plan.price}</p>
                      <ul className="mt-6 space-y-2.5">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2.5 text-sm">
                            <Check className="h-4 w-4 shrink-0 text-primary" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Link href="/register" className="mt-6 block">
                        <Button className="w-full" variant={plan.highlight ? 'default' : 'outline'}>
                          Get started
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-2xl text-center">
              <div className="overflow-hidden rounded-2xl border-2 border-dashed border-emerald-300/80 bg-gradient-to-br from-emerald-50 to-teal-50 p-10 shadow-card dark:border-emerald-800 dark:from-emerald-950/40 dark:to-teal-950/30">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/20">
                  <Gift className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </span>
                <h2 className="mt-5 font-display text-3xl font-bold">Free while we launch</h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Payments are not live yet, and that is on purpose. Enjoy{' '}
                  <strong className="text-foreground">full Premium access</strong> for{' '}
                  {billingConfig.freeTrialDays} days with no credit card, no checkout, no catch.
                </p>
                <ul className="mx-auto mt-8 max-w-sm space-y-2.5 text-left text-sm">
                  {[
                    'Unlimited goals and planners',
                    'Affordability checks before you buy',
                    'Reports with Excel export',
                    'Budget alerts and money notes',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="mt-8 inline-block">
                  <Button size="lg" className="gap-2 px-8 shadow-lg shadow-primary/25">
                    Create free account <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <p className="mt-4 text-xs text-muted-foreground">
                  We will announce pricing before anything is charged.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Ready to get started?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Set up takes a few minutes. Add your salary, log a couple of expenses, and you&apos;re good to go.
          </p>
          <Link href="/register" className="mt-8 inline-block">
            <Button size="lg" className="h-12 gap-2 px-10 text-base shadow-lg shadow-primary/25">
              Create free account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t bg-muted/20 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground md:flex-row">
          <GoalNestLogo size="sm" />
          <p>© 2026 GoalNest · Personal finance for India</p>
        </div>
      </footer>
    </div>
  );
}
