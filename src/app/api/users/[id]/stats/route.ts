import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { validateBody } from "@/lib/validate";
import { db } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { notificationService } from "@/services/notificationService";

const updateStatsSchema = z.object({
  portfolioValue: z.number().nullable().optional(),
  totalInvestment: z.number().nullable().optional(),
  totalProfit: z.number().nullable().optional(),
  withdrawal: z.number().nullable().optional(),
  availableCash: z.number().nullable().optional(),
  isGrowthPaused: z.boolean().optional(),
  dailyGrowthRate: z.number().min(0, "Rate cannot be negative").max(100, "Rate cannot exceed 100%").nullable().optional(),
  pausedReason: z.string().nullable().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export const PUT = apiHandler(async (request: Request, context: unknown) => {
  const { id } = await (context as RouteContext).params;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return errorResponse("Forbidden", 403);
  }

  const data = await validateBody(request, updateStatsSchema);

  // Check if profile exists
  const profile = await db.profile.findUnique({
    where: { userId: id },
  });

  if (!profile) {
    return errorResponse("User profile not found", 404);
  }

  const wasPaused = profile.isGrowthPaused;
  const nowPaused = data.isGrowthPaused !== undefined ? data.isGrowthPaused : wasPaused;

  const updateData: Prisma.ProfileUpdateInput = {};
  if (data.portfolioValue !== undefined) updateData.customPortfolioValue = data.portfolioValue;
  if (data.totalInvestment !== undefined) updateData.customTotalInvestment = data.totalInvestment;
  if (data.totalProfit !== undefined) updateData.customTotalProfit = data.totalProfit;
  if (data.withdrawal !== undefined) updateData.customWithdrawal = data.withdrawal;
  if (data.availableCash !== undefined) updateData.customAvailableCash = data.availableCash;
  if (data.isGrowthPaused !== undefined) updateData.isGrowthPaused = data.isGrowthPaused;
  if (data.dailyGrowthRate !== undefined) {
    updateData.customDailyGrowthRate = data.dailyGrowthRate !== null ? data.dailyGrowthRate / 100 : null;
  }
  if (data.pausedReason !== undefined) updateData.pausedReason = data.pausedReason;

  // Update profile with manual values
  const updatedProfile = await db.profile.update({
    where: { userId: id },
    data: updateData,
  });

  // If newly paused, deliver notification to the user
  if (!wasPaused && nowPaused) {
    await notificationService.sendAccountPaused(
      id,
      data.pausedReason || "Your account is temporarily paused until deposit is made to keep up with the investment growth."
    );
  }

  return successResponse(updatedProfile, "User custom stats updated successfully");
});
