import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { validateParams } from "@/lib/validate";
import { db } from "@/lib/db";
import { z } from "zod";

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const GET = apiHandler(async (request: Request) => {
  const { token } = validateParams(request, verifyEmailSchema);

  const user = await db.user.findFirst({
    where: {
      verificationToken: token,
      deletedAt: null,
    },
  });

  if (!user) {
    return errorResponse("Invalid or expired email verification token", 400);
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
    },
  });

  return successResponse(null, "Your email has been verified successfully. You can now log in.");
});
