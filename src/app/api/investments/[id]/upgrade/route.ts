import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { db } from "@/lib/db";
import { notificationService } from "@/services/notificationService";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const upgradeSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
});

export const POST = apiHandler(async (request: Request, context: unknown) => {
  const { id } = await (context as RouteContext).params;
  const session = await getSession();

  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body", 400);
  }

  const result = upgradeSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(result.error.issues[0].message, 400);
  }

  const { planId } = result.data;

  // Retrieve the investment
  const investment = await db.investment.findFirst({
    where: {
      id,
      userId: session.userId,
      deletedAt: null,
    },
    include: {
      plan: true,
    },
  });

  if (!investment) {
    return errorResponse("Investment package not found", 404);
  }

  if (investment.status !== "ACTIVE") {
    return errorResponse("Only active investments can be upgraded", 400);
  }

  // Retrieve the new plan
  const newPlan = await db.investmentPlan.findFirst({
    where: {
      id: planId,
      enabled: true,
      deletedAt: null,
    },
  });

  if (!newPlan) {
    return errorResponse("Selected investment plan not found or disabled", 404);
  }

  if (newPlan.id === investment.planId) {
    return errorResponse("Investment is already assigned to this plan", 400);
  }

  // Update plan association
  const updatedInvestment = await db.investment.update({
    where: { id: investment.id },
    data: { planId: newPlan.id },
    include: { plan: true },
  });

  // Log in AuditLog
  await db.auditLog.create({
    data: {
      userId: session.userId,
      action: "UPGRADE_PLAN",
      details: `Upgraded investment ${investment.id} from ${investment.plan.name} to ${newPlan.name}`,
    },
  });

  // Notify and email
  try {
    await notificationService.sendPlanUpgraded(session.userId, investment.plan.name, newPlan.name);
  } catch (emailErr) {
    console.error("Failed to send plan upgrade email:", emailErr);
  }

  return successResponse(updatedInvestment, `Successfully upgraded to ${newPlan.name} plan`);
});
