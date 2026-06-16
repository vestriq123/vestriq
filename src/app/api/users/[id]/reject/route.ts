import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { db } from "@/lib/db";
import { notificationService } from "@/services/notificationService";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const rejectSchema = z.object({
  reason: z.string().optional(),
});

export const POST = apiHandler(async (request: Request, context: unknown) => {
  const { id } = await (context as RouteContext).params;
  const session = await getSession();
  
  if (!session || session.role !== "ADMIN") {
    return errorResponse("Forbidden", 403);
  }

  // Parse optionally provided reason
  let reason = "";
  try {
    const body = await request.json();
    const result = rejectSchema.safeParse(body);
    if (result.success && result.data.reason) {
      reason = result.data.reason;
    }
  } catch {
    // No body or failed parsing, proceed with default reason
  }

  // Check if user exists
  const user = await db.user.findUnique({
    where: { id },
  });

  if (!user) {
    return errorResponse("User not found", 404);
  }

  // Update user verificationStatus to REJECTED
  const updatedUser = await db.user.update({
    where: { id },
    data: {
      verificationStatus: "REJECTED",
    },
  });

  // Send rejection notification and email
  try {
    await notificationService.sendUserRejected(id, reason || undefined);
  } catch (emailErr) {
    console.error("Failed to send rejection email:", emailErr);
  }

  return successResponse(updatedUser, "User verification rejected successfully");
});

export default POST;
