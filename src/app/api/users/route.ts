import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { db } from "@/lib/db";

export const GET = apiHandler(async () => {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return errorResponse("Forbidden", 403);
  }

  const users = await db.user.findMany({
    where: { deletedAt: null },
    include: { role: true, profile: true },
    orderBy: { createdAt: "desc" },
  });

  return successResponse(users, "Users retrieved successfully");
});
