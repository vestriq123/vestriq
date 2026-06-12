import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { db } from "@/lib/db";

export const GET = apiHandler(async () => {
  const session = await getSession();
  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  const profile = await db.profile.findUnique({
    where: { userId: session.userId },
  });

  return successResponse(profile, "Profile retrieved successfully");
});
