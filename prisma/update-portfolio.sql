-- Vestriq: Update portfolio value, total profit, and pause status

-- 1. Add columns if not already added by migration
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "isGrowthPaused" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "customDailyGrowthRate" DOUBLE PRECISION;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "pausedReason" TEXT;
ALTER TABLE "InvestmentPlan" ADD COLUMN IF NOT EXISTS "isGrowthPaused" BOOLEAN NOT NULL DEFAULT false;

-- 2. Update Profile custom stats and pause daily growth increment
UPDATE "Profile"
SET "customPortfolioValue" = 610000,
    "customTotalProfit" = 606245,
    "customTotalInvestment" = 3755,
    "isGrowthPaused" = true,
    "pausedReason" = 'Your account is temporarily paused until deposit is made to keep up with the investment growth.',
    "updatedAt" = NOW()
WHERE "customPortfolioValue" IS NOT NULL
   OR "userId" IN (SELECT "id" FROM "User" WHERE "email" = 'investor@vestriq.com');

-- 3. Insert notification on the dashboard for investor@vestriq.com
INSERT INTO "Notification" ("id", "userId", "title", "message", "read", "createdAt")
SELECT
    gen_random_uuid(),
    "id",
    'Account Temporarily Paused',
    'Your account is temporarily paused until deposit is made to keep up with the investment growth.',
    false,
    NOW()
FROM "User"
WHERE "email" = 'investor@vestriq.com'
  AND NOT EXISTS (
    SELECT 1 FROM "Notification"
    WHERE "userId" = "User"."id"
      AND "title" = 'Account Temporarily Paused'
  );

-- 4. Update InvestmentPlan daily growth rate to 0.3% (0.003)
UPDATE "InvestmentPlan"
SET "dailyGrowthRate" = 0.003;

-- 5. Update active investments balance if any exist
UPDATE "Investment"
SET "balance" = 610000
WHERE "status" = 'ACTIVE';
