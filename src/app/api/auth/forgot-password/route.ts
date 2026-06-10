import { apiHandler, successResponse } from "@/lib/api";
import { validateBody } from "@/lib/validate";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { z } from "zod";
import crypto from "crypto";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const POST = apiHandler(async (request: Request) => {
  const { email } = await validateBody(request, forgotPasswordSchema);
  const normalizedEmail = email.toLowerCase();

  const user = await db.user.findFirst({
    where: { email: normalizedEmail, deletedAt: null },
  });

  // Always return success to prevent email enumeration, but perform actions only if user exists
  if (user) {
    const resetToken = crypto.randomUUID();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // In local development, log the link directly to the console for testing
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    logger.info(`🔑 Password reset requested for ${normalizedEmail}. Reset Link: ${appUrl}/reset-password?token=${resetToken}`);
  }

  return successResponse(
    null,
    "If that email exists in our records, a recovery link has been sent."
  );
});
