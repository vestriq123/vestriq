import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { validateBody } from "@/lib/validate";
import { db } from "@/lib/db";
import { z } from "zod";

const updateStatsSchema = z.object({
  portfolioValue: z.number().nullable(),
  totalInvestment: z.number().nullable(),
  totalProfit: z.number().nullable(),
  withdrawal: z.number().nullable(),
  availableCash: z.number().nullable(),
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

  // Update profile with manual values (or null to clear)
  const updatedProfile = await db.profile.update({
    where: { userId: id },
    data: {
      customPortfolioValue: data.portfolioValue,
      customTotalInvestment: data.totalInvestment,
      customTotalProfit: data.totalProfit,
      customWithdrawal: data.withdrawal,
      customAvailableCash: data.availableCash,
    },
  });

  return successResponse(updatedProfile, "User custom stats updated successfully");
});
