import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { validateBody } from "@/lib/validate";
import { investmentPlanRepository } from "@/repositories/investmentPlanRepository";
import { z } from "zod";

const updatePlanSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  description: z.string().min(5, "Description must be at least 5 characters").optional(),
  minAmount: z.number().positive("Minimum amount must be positive").optional(),
  maxAmount: z.number().positive("Maximum amount must be positive").optional(),
  enabled: z.boolean().optional(),
}).refine(data => {
  if (data.minAmount !== undefined && data.maxAmount !== undefined) {
    return data.maxAmount >= data.minAmount;
  }
  return true;
}, {
  message: "Maximum amount must be greater than or equal to minimum amount",
  path: ["maxAmount"],
});

type RouteContext = { params: Promise<{ id: string }> };

export const GET = apiHandler(async (request: Request, context: unknown) => {
  const { id } = await (context as RouteContext).params;
  const plan = await investmentPlanRepository.findById(id);
  if (!plan) {
    return errorResponse("Investment plan not found", 404);
  }
  return successResponse(plan, "Investment plan details retrieved");
});

export const PUT = apiHandler(async (request: Request, context: unknown) => {
  const { id } = await (context as RouteContext).params;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return errorResponse("Forbidden", 403);
  }

  const data = await validateBody(request, updatePlanSchema);
  const plan = await investmentPlanRepository.findById(id);
  if (!plan) {
    return errorResponse("Investment plan not found", 404);
  }

  if (data.name && data.name !== plan.name) {
    const existing = await investmentPlanRepository.findByName(data.name);
    if (existing) {
      return errorResponse("An investment plan with this name already exists", 400);
    }
  }

  const updatedPlan = await investmentPlanRepository.update(id, data);
  return successResponse(updatedPlan, "Investment plan updated successfully");
});

export const DELETE = apiHandler(async (request: Request, context: unknown) => {
  const { id } = await (context as RouteContext).params;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return errorResponse("Forbidden", 403);
  }

  const plan = await investmentPlanRepository.findById(id);
  if (!plan) {
    return errorResponse("Investment plan not found", 404);
  }

  await investmentPlanRepository.softDelete(id);
  return successResponse(null, "Investment plan deleted successfully");
});
