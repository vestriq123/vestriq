import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { validateBody } from "@/lib/validate";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const POST = apiHandler(async (request: Request) => {
  const { token, password } = await validateBody(request, resetPasswordSchema);

  const user = await db.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: {
        gt: new Date(),
      },
      deletedAt: null,
    },
  });

  if (!user) {
    return errorResponse("Invalid or expired recovery token", 400);
  }

  // Hash new password
  const passwordHash = await hashPassword(password);

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return successResponse(null, "Password reset successfully. You can now log in.");
});
