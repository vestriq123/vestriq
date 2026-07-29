import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { analyticsService } from "@/services/analyticsService";

export const GET = apiHandler(async (request: Request) => {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return errorResponse("Forbidden", 403);
  }

  const { searchParams } = new URL(request.url);
  const weeks = Number(searchParams.get("weeks")) || 8;

  const analytics = await analyticsService.getPlatformAnalytics(weeks);
  return successResponse(analytics, "Platform analytics retrieved successfully");
});
