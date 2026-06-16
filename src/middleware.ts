import { NextResponse, NextRequest } from "next/server";
import { JWTPayload } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

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

  // 1. User-Agent Bot / Scraper filtering
  const userAgent = request.headers.get("user-agent") || "";
  const botRegex = /curl|wget|python-requests|scrape|headless|phantomjs|selenium|playwright|puppeteer|zgrab|nmap|censys|sqlmap/i;
  if (botRegex.test(userAgent)) {
    return new NextResponse("Access forbidden for automated scripts.", { status: 403 });
  }

  // 2. API Rate Limiting
  if (pathname.startsWith("/api")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local-ip";
    
    // Apply stricter limits on authentication routes
    const isAuthEndpoint = pathname.includes("/api/auth/login") || 
                           pathname.includes("/api/auth/register") || 
                           pathname.includes("/api/auth/verify-email") || 
                           pathname.includes("/api/auth/reset-password");
                           
    const limit = isAuthEndpoint ? 10 : 60;
    const windowMs = 60000; // 1 minute
    
    const isLimited = checkRateLimit(ip, pathname, limit, windowMs);
    if (isLimited) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Too many requests. Please try again later.",
            code: 429
          }
        },
        { status: 429 }
      );
    }
  }

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAdminRoute = pathname.startsWith("/admin");
  const isPendingRoute = pathname === "/verification-pending";
  const isRejectedRoute = pathname === "/verification-rejected";

  if (isDashboardRoute || isAdminRoute || isPendingRoute || isRejectedRoute) {
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

    if (payload.role === "USER") {
      const status = payload.verificationStatus;
      if (status === "PENDING" && !isPendingRoute) {
        return NextResponse.redirect(new URL("/verification-pending", request.url));
      }
      if (status === "REJECTED" && !isRejectedRoute) {
        return NextResponse.redirect(new URL("/verification-rejected", request.url));
      }
      if (status === "APPROVED" && (isPendingRoute || isRejectedRoute)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } else if (payload.role === "ADMIN" && (isPendingRoute || isRejectedRoute)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password");
  if (isAuthRoute) {
    const token = request.cookies.get("accessToken")?.value;
    if (token) {
      const payload = await verifyJwtSignature(token);
      if (payload) {
        if (payload.role === "USER") {
          const status = payload.verificationStatus;
          if (status === "PENDING") {
            return NextResponse.redirect(new URL("/verification-pending", request.url));
          }
          if (status === "REJECTED") {
            return NextResponse.redirect(new URL("/verification-rejected", request.url));
          }
        }
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
    "/api/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verification-pending",
    "/verification-rejected"
  ],
};

