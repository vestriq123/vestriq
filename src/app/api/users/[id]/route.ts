import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { db } from "@/lib/db";
import { userRepository } from "@/repositories/userRepository";

type RouteContext = { params: Promise<{ id: string }> };

export const DELETE = apiHandler(async (request: Request, context: unknown) => {
  const { id } = await (context as RouteContext).params;
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return errorResponse("Forbidden", 403);
  }

  if (session.userId === id) {
    return errorResponse("You cannot delete your own account", 400);
  }

  const user = await userRepository.findById(id);
  if (!user) {
    return errorResponse("User not found", 404);
  }

  await userRepository.softDelete(id);

  await db.auditLog.create({
    data: {
      userId: session.userId,
      action: "user.delete",
      details: JSON.stringify({ deletedUserId: id, deletedUsername: user.username, deletedEmail: user.email }),
    },
  });

  return successResponse(null, "User deleted successfully");
});
