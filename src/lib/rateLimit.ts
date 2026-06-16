import { ApiError } from "./errors";

interface RateLimitTracker {
  timestamps: number[];
}

const trackerStore = new Map<string, RateLimitTracker>();

/**
 * Checks if a request should be rate limited.
 * Returns true if rate limited, false if allowed.
 */
export function checkRateLimit(ip: string, route: string, limit: number = 10, windowMs: number = 60000): boolean {
  const key = `${ip}:${route}`;
  const now = Date.now();
  
  if (!trackerStore.has(key)) {
    trackerStore.set(key, { timestamps: [now] });
    return false;
  }

  const tracker = trackerStore.get(key)!;
  
  // Keep only timestamps within the sliding window
  tracker.timestamps = tracker.timestamps.filter(t => now - t < windowMs);

  if (tracker.timestamps.length >= limit) {
    return true;
  }

  tracker.timestamps.push(now);
  return false;
}

// Simple sliding window memory-based rate limiter helper.
export function rateLimit(ip: string, route: string, limit: number = 10, windowMs: number = 60000) {
  if (checkRateLimit(ip, route, limit, windowMs)) {
    throw new ApiError(429, "Too many requests. Please try again later.");
  }
}

// Global middleware-friendly request rate limiter helper
export function rateLimitRequest(request: Request, limit: number = 10, windowMs: number = 60000) {
  const ip = request.headers.get("x-forwarded-for") || "local-ip";
  const url = new URL(request.url);
  rateLimit(ip, url.pathname, limit, windowMs);
}

