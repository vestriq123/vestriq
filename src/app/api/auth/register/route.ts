import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";
import { notificationService } from "@/services/notificationService";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username must contain only alphanumeric characters and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  idDocumentType: z.string().min(1, "Document type is required"),
  idDocumentUrl: z.string().min(1, "Document upload is required"),
  ssn: z.string().min(9, "Social Security Number must be at least 9 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { fullName, username, email, password, idDocumentType, idDocumentUrl, ssn } = result.data;
    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username.toLowerCase();

    // Check email and username availability
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { username: normalizedUsername }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return NextResponse.json({ error: "Email is already taken" }, { status: 400 });
      }
      return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Initial check: if no users exist in database, make the first user an ADMIN.
    // This provides a convenient bootstrap mechanism for admin access.
    const userCount = await db.user.count();
    const roleName = userCount === 0 ? "ADMIN" : "USER";

    const dbRole = await db.role.findUnique({
      where: { name: roleName }
    });

    if (!dbRole) {
      return NextResponse.json(
        { error: `Database configuration error: Role '${roleName}' not found` },
        { status: 500 }
      );
    }

    // Create user and profile in transaction
    const newUser = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          username: normalizedUsername,
          passwordHash,
          roleId: dbRole.id,
        },
        include: {
          role: true
        }
      });

      await tx.profile.create({
        data: {
          userId: user.id,
          fullName,
          idDocumentType,
          idDocumentUrl,
          ssn,
        },
      });

      return user;
    });

    // Create session / cookies payload (but do not set cookies to avoid auto-login)
    const userRoleName = newUser.role.name as "USER" | "ADMIN";

    // Send confirmation/welcome email
    try {
      await notificationService.sendRegistrationConfirmation(newUser.id);
    } catch (emailErr) {
      console.error("Failed to send welcome email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: userRoleName,
        fullName,
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
