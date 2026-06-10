import { ApiError } from "./errors";

interface RateLimitTracker {
  timestamps: number[];
}

const trackerStore = new Map<string, RateLimitTracker>();

// Simple sliding window memory-based rate limiter helper.
export function rateLimit(ip: string, route: string, limit: number = 10, windowMs: number = 60000) {
  const key = `${ip}:${route}`;
  const now = Date.now();
  
  if (!trackerStore.has(key)) {
    trackerStore.set(key, { timestamps: [now] });
    return;
  }

  const tracker = trackerStore.get(key)!;
  
  // Keep only timestamps within the sliding window
  tracker.timestamps = tracker.timestamps.filter(t => now - t < windowMs);

  if (tracker.timestamps.length >= limit) {
    throw new ApiError(429, "Too many requests. Please try again later.");
  }

  tracker.timestamps.push(now);
}

// Global middleware-friendly request rate limiter helper
export function rateLimitRequest(request: Request, limit: number = 10, windowMs: number = 60000) {
  const ip = request.headers.get("x-forwarded-for") || "local-ip";
  const url = new URL(request.url);
  rateLimit(ip, url.pathname, limit, windowMs);
}
