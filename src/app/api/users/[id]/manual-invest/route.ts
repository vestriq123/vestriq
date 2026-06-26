import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { validateBody } from "@/lib/validate";
import { db } from "@/lib/db";
import { z } from "zod";
import { notificationService } from "@/services/notificationService";
import { InvestmentStatus, TransactionType, TransactionStatus } from "@prisma/client";

const manualInvestSchema = z.object({
  amount: z.number().positive("Amount must be a positive number"),
  planId: z.string().uuid("Invalid plan ID format"),
});

type RouteContext = { params: Promise<{ id: string }> };

export const POST = apiHandler(async (request: Request, context: unknown) => {
  const { id } = await (context as RouteContext).params;
  const session = await getSession();
  
  if (!session || session.role !== "ADMIN") {
    return errorResponse("Forbidden", 403);
  }

  const { amount, planId } = await validateBody(request, manualInvestSchema);

  // Check if user exists
  const user = await db.user.findUnique({
    where: { id },
  });

  if (!user) {
    return errorResponse("User not found", 404);
  }

  // Check if plan exists and is enabled
  const plan = await db.investmentPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    return errorResponse("Investment plan not found", 404);
  }

  if (!plan.enabled) {
    return errorResponse("Investment plan is disabled", 400);
  }

  // Run transaction to create investment, transaction, and update profile override if it exists
  const result = await db.$transaction(async (tx) => {
    // 1. Create investment
    const investment = await tx.investment.create({
      data: {
        userId: id,
        planId: planId,
        amount: amount,
        balance: amount,
        status: InvestmentStatus.ACTIVE,
      },
      include: {
        plan: true,
      },
    });

    // 2. Create transaction
    const ref = `TXN-MANUAL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    await tx.transaction.create({
      data: {
        userId: id,
        type: TransactionType.INVESTMENT_FUND,
        status: TransactionStatus.SUCCESS,
        amount: amount,
        reference: ref,
        description: `Manual investment credit for ${plan.name} Plan`,
      },
    });

    // 3. Update manual profile stats overrides if they exist
    const profile = await tx.profile.findUnique({
      where: { userId: id },
    });

    if (profile) {
      const updatedData: { customTotalInvestment?: number; customPortfolioValue?: number } = {};
      if (profile.customTotalInvestment !== null) {
        updatedData.customTotalInvestment = profile.customTotalInvestment + amount;
      }
      if (profile.customPortfolioValue !== null) {
        updatedData.customPortfolioValue = profile.customPortfolioValue + amount;
      }

      if (Object.keys(updatedData).length > 0) {
        await tx.profile.update({
          where: { userId: id },
          data: updatedData,
        });
      }
    }

    // 4. Send Notification
    await notificationService.sendDepositApproved(id, amount, plan.name, tx);

    return investment;
  });

  return successResponse(result, "Manual investment credited successfully");
});
