-- AlterTable
ALTER TABLE "InvestmentPlan" ADD COLUMN     "durationMonths" INTEGER NOT NULL DEFAULT 3;

-- Backfill existing seeded plans with their current (previously hardcoded-by-name) duration
-- so this migration is behavior-neutral for existing data.
UPDATE "InvestmentPlan" SET "durationMonths" = 6 WHERE "name" = 'Premium Growth';
UPDATE "InvestmentPlan" SET "durationMonths" = 9 WHERE "name" = 'Vanguard Select';
UPDATE "InvestmentPlan" SET "durationMonths" = 12 WHERE "name" = 'Apex Sovereign';
