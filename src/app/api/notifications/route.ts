import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { db } from "@/lib/db";

export const GET = apiHandler(async () => {
  const session = await getSession();
  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  const notifications = await db.notification.findMany({
    where: {
      userId: session.userId,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return successResponse(notifications, "Notifications retrieved successfully");
});
