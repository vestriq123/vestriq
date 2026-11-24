import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { db } from "@/lib/db";
import { notificationService } from "@/services/notificationService";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = apiHandler(async (request: Request, context: unknown) => {
  const { id } = await (context as RouteContext).params;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return errorResponse("Forbidden", 403);
  }

  const profile = await db.profile.findUnique({
    where: { userId: id },
  });

  if (!profile) {
    return errorResponse("User profile not found", 404);
  }

  const nextPaused = !profile.isGrowthPaused;

  const updatedProfile = await db.profile.update({
    where: { userId: id },
    data: {
      isGrowthPaused: nextPaused,
      pausedReason: nextPaused
        ? "Your account is temporarily paused until deposit is made to keep up with the investment growth."
        : null,
    },
  });

  if (nextPaused) {
    await notificationService.sendAccountPaused(
      id,
      "Your account is temporarily paused until deposit is made to keep up with the investment growth."
    );
  }

  return successResponse(
    updatedProfile,
    nextPaused ? "Daily increment paused for user" : "Daily increment resumed for user"
  );
});
