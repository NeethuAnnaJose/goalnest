/** Must match backend BILLING_ENABLED — payments are off until Stripe/Razorpay is integrated. */
export const billingConfig = {
  enabled: process.env.NEXT_PUBLIC_BILLING_ENABLED === 'true',
  freeTrialDays: Number(process.env.NEXT_PUBLIC_FREE_TRIAL_DAYS ?? '30') || 30,
  get trialMessage() {
    return this.enabled
      ? 'Simple plans when you are ready to upgrade'
      : `Everything free for ${this.freeTrialDays} days no payment needed`;
  },
  get launchBadge() {
    return this.enabled ? null : 'Free during early access';
  },
};
