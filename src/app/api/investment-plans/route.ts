import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { validateBody } from "@/lib/validate";
import { investmentPlanRepository } from "@/repositories/investmentPlanRepository";
import { z } from "zod";

const createPlanSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  minAmount: z.number().positive("Minimum amount must be positive"),
  maxAmount: z.number().positive("Maximum amount must be positive"),
}).refine(data => data.maxAmount >= data.minAmount, {
  message: "Maximum amount must be greater than or equal to minimum amount",
  path: ["maxAmount"],
});

export const GET = apiHandler(async (request: Request) => {
  const session = await getSession();
  
  // If request has query param all=true, check if caller is admin
  const { searchParams } = new URL(request.url);
  const showAll = searchParams.get("all") === "true";
  
  if (showAll) {
    if (!session || session.role !== "ADMIN") {
      return errorResponse("Forbidden", 403);
    }
    const plans = await investmentPlanRepository.findAll(false);
    return successResponse(plans, "All investment plans retrieved successfully");
  }

  // Normal users only see enabled plans
  const plans = await investmentPlanRepository.findAll(true);
  return successResponse(plans, "Active investment plans retrieved successfully");
});

export const POST = apiHandler(async (request: Request) => {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return errorResponse("Forbidden", 403);
  }

  const data = await validateBody(request, createPlanSchema);
  
  // Check if name is already taken
  const existing = await investmentPlanRepository.findByName(data.name);
  if (existing) {
    return errorResponse("An investment plan with this name already exists", 400);
  }

  const plan = await investmentPlanRepository.create(data);
  return successResponse(plan, "Investment plan created successfully", 201);
});
