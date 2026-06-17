-- AlterTable
ALTER TABLE "savings_accounts" ADD COLUMN "monthlyDebitAmount" BIGINT;

-- CreateTable
CREATE TABLE "savings_contributions" (
    "id" TEXT NOT NULL,
    "savingsAccountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savings_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "savings_contributions_userId_month_idx" ON "savings_contributions"("userId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "savings_contributions_savingsAccountId_month_key" ON "savings_contributions"("savingsAccountId", "month");

-- AddForeignKey
ALTER TABLE "savings_contributions" ADD CONSTRAINT "savings_contributions_savingsAccountId_fkey" FOREIGN KEY ("savingsAccountId") REFERENCES "savings_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_contributions" ADD CONSTRAINT "savings_contributions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
