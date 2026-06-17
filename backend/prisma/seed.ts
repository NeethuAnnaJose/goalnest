import { PrismaClient, PlanTier } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      tier: PlanTier.FREE,
      name: 'Free',
      description: 'Basic financial tracking',
      priceMonthly: 0n,
      priceYearly: 0n,
      features: { maxGoals: 3, aiInsights: false, reports: 'monthly' },
    },
    {
      tier: PlanTier.PREMIUM,
      name: 'Premium',
      description: 'Unlimited goals, weekly notes, and full reports',
      priceMonthly: 49900n,
      priceYearly: 499900n,
      features: { maxGoals: -1, aiInsights: true, reports: 'all' },
    },
    {
      tier: PlanTier.FAMILY,
      name: 'Family',
      description: 'Premium for up to 5 family members',
      priceMonthly: 79900n,
      priceYearly: 799900n,
      features: { maxGoals: -1, aiInsights: true, reports: 'all', familyMembers: 5 },
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { tier: plan.tier },
      create: plan,
      update: plan,
    });
  }

  console.log('Seeded subscription plans');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
