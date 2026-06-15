import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { validateBody } from "@/lib/validate";
import { depositRepository } from "@/repositories/depositRepository";
import { investmentPlanRepository } from "@/repositories/investmentPlanRepository";
import { z } from "zod";

const createDepositSchema = z.object({
  planId: z.string().uuid("Invalid plan selection"),
  walletId: z.string().uuid("Invalid wallet selection"),
  amount: z.number().positive("Deposit amount must be positive"),
  proofUrl: z.string().url("Invalid proof image URL").optional(),
  durationMonths: z.number().int().min(3).max(12).optional(),
  companyName: z.string().min(1, "Please select a company to invest in"),
});

export const GET = apiHandler(async (request: Request) => {
  const session = await getSession();
  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const queryUserId = searchParams.get("userId");

  // Admins can see all deposits or filter by a specific user.
  if (session.role === "ADMIN") {
    if (queryUserId) {
      const deposits = await depositRepository.findByUserId(queryUserId);
      return successResponse(deposits, "User deposits retrieved successfully");
    }
    const deposits = await depositRepository.findAll();
    return successResponse(deposits, "All platform deposits retrieved successfully");
  }

  // Regular users only see their own deposits
  const deposits = await depositRepository.findByUserId(session.userId);
  return successResponse(deposits, "Your deposits retrieved successfully");
});

export const POST = apiHandler(async (request: Request) => {
  const session = await getSession();
  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  const data = await validateBody(request, createDepositSchema);

  // Validate the plan limits
  const plan = await investmentPlanRepository.findById(data.planId);
  if (!plan) {
    return errorResponse("Selected investment plan not found", 404);
  }
  if (!plan.enabled) {
    return errorResponse("Selected investment plan is currently disabled", 400);
  }
  if (data.amount < plan.minAmount || data.amount > plan.maxAmount) {
    return errorResponse(
      `Deposit amount must be between $${plan.minAmount.toLocaleString()} and $${plan.maxAmount.toLocaleString()} for the ${plan.name} plan.`,
      400
    );
  }

  // Enforce duration based on plan name
  let durationMonths = 3;
  if (plan.name === "Standard Alpha") {
    durationMonths = 3;
  } else if (plan.name === "Premium Growth") {
    durationMonths = 6;
  } else if (plan.name === "Vanguard Select") {
    durationMonths = 9;
  } else if (plan.name === "Apex Sovereign") {
    durationMonths = 12;
  }

  const deposit = await depositRepository.create({
    userId: session.userId,
    planId: data.planId,
    amount: data.amount,
    walletId: data.walletId,
    proofUrl: data.proofUrl,
    durationMonths: durationMonths,
    companyName: data.companyName,
  });

  return successResponse(deposit, "Deposit request initiated successfully. Awaiting manual admin confirmation.", 201);
});
