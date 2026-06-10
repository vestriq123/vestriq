import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { investmentRepository } from "@/repositories/investmentRepository";

export const GET = apiHandler(async (request: Request) => {
  const session = await getSession();
  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const queryUserId = searchParams.get("userId");
  const showAll = searchParams.get("all") === "true";

  if (showAll) {
    if (session.role !== "ADMIN") {
      return errorResponse("Forbidden", 403);
    }
    const investments = await investmentRepository.findAll();
    return successResponse(investments, "All investments retrieved successfully");
  }

  let targetUserId = session.userId;

  if (queryUserId) {
    if (session.role !== "ADMIN") {
      return errorResponse("Forbidden", 403);
    }
    targetUserId = queryUserId;
  }

  const investments = await investmentRepository.findByUserId(targetUserId);
  return successResponse(investments, "Investments retrieved successfully");
});
