import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = apiHandler(async (request: Request, context: unknown) => {
  const { id } = await (context as RouteContext).params;
  const session = await getSession();
  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  const notification = await db.notification.findFirst({
    where: {
      id,
      userId: session.userId,
    },
  });

  if (!notification) {
    return errorResponse("Notification not found", 404);
  }

  const updatedNotification = await db.notification.update({
    where: { id },
    data: { read: true },
  });

  return successResponse(updatedNotification, "Notification marked as read");
});
