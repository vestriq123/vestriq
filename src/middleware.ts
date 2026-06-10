import { NextResponse, NextRequest } from "next/server";
import { JWTPayload } from "@/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development";

function base64urlDecode(str: string) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const raw = atob(base64);
  const val = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    val[i] = raw.charCodeAt(i);
  }
  return new TextDecoder().decode(val);
}

async function verifyJwtSignature(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    const sigBuf = Uint8Array.from(
      atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const dataToVerify = enc.encode(`${headerB64}.${payloadB64}`);
    const isValid = await crypto.subtle.verify("HMAC", key, sigBuf, dataToVerify);

    if (!isValid) return null;

    const payload = JSON.parse(base64urlDecode(payloadB64)) as JWTPayload & { exp?: number };
    
    // Check exp which is a standard number inside JWT claim
    const exp = payload.exp;
    if (exp && Date.now() >= exp * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAdminRoute = pathname.startsWith("/admin");

  if (isDashboardRoute || isAdminRoute) {
    const token = request.cookies.get("accessToken")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const payload = await verifyJwtSignature(token);
    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (isAdminRoute && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password");
  if (isAuthRoute) {
    const token = request.cookies.get("accessToken")?.value;
    if (token) {
      const payload = await verifyJwtSignature(token);
      if (payload) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password"
  ],
};
