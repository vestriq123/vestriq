-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "isGrowthPaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "customDailyGrowthRate" DOUBLE PRECISION,
ADD COLUMN "pausedReason" TEXT;

-- AlterTable
ALTER TABLE "InvestmentPlan" ADD COLUMN "isGrowthPaused" BOOLEAN NOT NULL DEFAULT false;
