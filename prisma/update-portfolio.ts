import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Starting portfolio, profit & pause status update...");

  // 1. Update all investment plans to 0.3% (0.003) daily compounding rate
  const updatedPlans = await prisma.investmentPlan.updateMany({
    data: {
      dailyGrowthRate: 0.003,
    },
  });
  console.log(`✅ Updated ${updatedPlans.count} investment plans to 0.3%/day growth rate (0.003)`);

  // 2. Update user profiles:
  // - Reduce portfolio value to $610,000
  // - Reduce total profit to $606,245
  // - Set total investment to $3,755
  // - Pause daily growth increment until deposit is made
  const profilesToUpdate = await prisma.profile.findMany({
    where: {
      OR: [
        { customPortfolioValue: { not: null } },
        { user: { email: "investor@vestriq.com" } },
      ],
    },
    include: {
      user: true,
    },
  });

  const pauseNotice = "Your account is temporarily paused until deposit is made to keep up with the investment growth.";

  if (profilesToUpdate.length > 0) {
    for (const profile of profilesToUpdate) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          customPortfolioValue: 610000,
          customTotalProfit: 606245,
          customTotalInvestment: 3755,
          isGrowthPaused: true,
          pausedReason: pauseNotice,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Updated profile ${profile.id} (portfolio: $610,000, profit: $606,245, growth: PAUSED)`);

      // Create pause notification if not already present
      const existingNotif = await prisma.notification.findFirst({
        where: {
          userId: profile.userId,
          title: "Account Temporarily Paused",
        },
      });
      if (!existingNotif) {
        await prisma.notification.create({
          data: {
            userId: profile.userId,
            title: "Account Temporarily Paused",
            message: pauseNotice,
            read: false,
          },
        });
        console.log(`🔔 Delivered pause notification to user ${profile.userId}`);
      }
    }
  } else {
    // If no existing custom profiles, update all profiles
    const allProfiles = await prisma.profile.findMany();
    for (const profile of allProfiles) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          customPortfolioValue: 610000,
          customTotalProfit: 606245,
          customTotalInvestment: 3755,
          isGrowthPaused: true,
          pausedReason: pauseNotice,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Updated profile ${profile.id} (portfolio: $610,000, profit: $606,245, growth: PAUSED)`);
    }
  }

  // 3. Update any active investments if present
  const updatedInvestments = await prisma.investment.updateMany({
    where: {
      status: "ACTIVE",
    },
    data: {
      balance: 610000,
    },
  });
  if (updatedInvestments.count > 0) {
    console.log(`✅ Updated ${updatedInvestments.count} active investments to balance $610,000`);
  }

  console.log("🎉 Successfully updated portfolio values, set daily compounding to 0.3%, and paused account increment!");
}

main()
  .catch((e) => {
    console.error("❌ Error running update-portfolio:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
