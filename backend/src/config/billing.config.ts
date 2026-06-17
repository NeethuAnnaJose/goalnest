import { PlanTier } from '@prisma/client';

/** SaaS billing is not live yet set BILLING_ENABLED=true when Stripe/Razorpay is wired. */
export function isBillingEnabled(): boolean {
  return process.env.BILLING_ENABLED === 'true';
}

export function getFreeTrialDays(): number {
  const days = Number(process.env.FREE_TRIAL_DAYS ?? '30');
  return Number.isFinite(days) && days > 0 ? days : 30;
}

/** Plan assigned to new users while billing is disabled (full access launch period). */
export function getSignupPlanTier(): PlanTier {
  if (isBillingEnabled()) {
    return PlanTier.FREE;
  }
  return PlanTier.PREMIUM;
}

export function getPublicBillingConfig() {
  return {
    billingEnabled: isBillingEnabled(),
    freeTrialDays: getFreeTrialDays(),
    message: isBillingEnabled()
      ? 'Choose a plan that fits you'
      : `Full access free for ${getFreeTrialDays()} days no card required`,
  };
}
