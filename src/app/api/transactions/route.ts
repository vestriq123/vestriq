import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { db } from "@/lib/db";

export const GET = apiHandler(async () => {
  const session = await getSession();
  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  const transactions = await db.transaction.findMany({
    where: {
      userId: session.userId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  return successResponse(transactions, "Transactions list retrieved");
});
