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
    const normalizedIdentifier = identifier.toLowerCase();

    // Find user by email or username
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: normalizedIdentifier },
          { username: normalizedIdentifier }
        ]
      },
      include: {
        profile: true,
        role: true
      }
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

    // Set auth cookies
    const userRoleName = user.role.name as "USER" | "ADMIN";
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: userRoleName,
    };
    await setAuthCookies(payload);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: userRoleName,
        fullName: user.profile?.fullName || "",
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
