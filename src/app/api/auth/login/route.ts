import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparePassword, setAuthCookies } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { identifier, password } = result.data;
    const normalizedIdentifier = identifier.toLowerCase().trim();

    // Find user by email or username, excluding deleted accounts
    // Select specific fields so schema additions on Profile or Role don't break login
    const user = await db.user.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { email: normalizedIdentifier },
          { username: normalizedIdentifier }
        ]
      },
      include: {
        profile: {
          select: {
            fullName: true,
          },
        },
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username, email, or password" },
        { status: 400 }
      );
    }

    // Compare passwords
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid username, email, or password" },
        { status: 400 }
      );
    }

    // Set auth cookies safely
    const userRoleName = (user.role?.name || "USER") as "USER" | "ADMIN";
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: userRoleName,
      verificationStatus: user.verificationStatus,
    };
    await setAuthCookies(payload);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: userRoleName,
        verificationStatus: user.verificationStatus,
        fullName: user.profile?.fullName || "",
      }
    });

  } catch (error: unknown) {
    console.error("Login error:", error);

    const err = error as { code?: string; message?: string };
    const errorMessage = err?.message || String(error);
    const errorCode = err?.code;

    // Detect missing columns or tables (Prisma P2021, P2022)
    const isSchemaError = errorCode === "P2021" || errorCode === "P2022" ||
      errorMessage.includes("column") || errorMessage.includes("does not exist") || errorMessage.includes("relation");

    // Detect DB connection issues (Prisma P1000, P1001, etc.)
    const isConnError = errorCode === "P1000" || errorCode === "P1001" || errorCode === "P1017" ||
      errorMessage.includes("Can't reach database") || errorMessage.includes("Authentication failed");

    let clientMessage = "Internal Server Error";
    if (isSchemaError) {
      clientMessage = "Database schema mismatch. Please run 'npx prisma db push' or apply the migration script on your production database.";
    } else if (isConnError) {
      clientMessage = "Database connection failed. Please verify DATABASE_URL and DIRECT_URL in your deployment settings.";
    }

    return NextResponse.json(
      { 
        error: clientMessage,
        details: process.env.NODE_ENV !== "production" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
