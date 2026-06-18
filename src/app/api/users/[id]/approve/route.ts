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

  // Check if user exists
  const user = await db.user.findUnique({
    where: { id },
  });

  if (!user) {
    return errorResponse("User not found", 404);
  }

  // Update user verificationStatus to APPROVED
  const updatedUser = await db.user.update({
    where: { id },
    data: {
      verificationStatus: "APPROVED",
    },
  });

  // Send approval notification and email
  try {
    await notificationService.sendUserApproved(id);
  } catch (emailErr) {
    console.error("Failed to send approval email:", emailErr);
  }

  return successResponse(updatedUser, "User approved successfully");
});
