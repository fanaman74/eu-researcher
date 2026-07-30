/**
 * Zero-dependency API hardening helpers: in-memory rate limiting,
 * client-IP extraction, and a simple same-host origin check.
 *
 * Note: the rate limiter is per server instance (in-memory Map). It is a
 * best-effort guard against casual abuse and runaway LLM costs, not a
 * distributed limiter — state is not shared across instances/replicas.
 */

// Sliding-window request timestamps per identifier.
const rateLimitStore = new Map<string, number[]>();
let lastCleanup = Date.now();

/**
 * Sliding-window rate limiter. Returns true while the identifier is within
 * `limit` requests per `windowMs`; false once the limit is exceeded.
 * Stale keys are purged periodically so the Map does not grow unbounded.
 */
export function checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  // Periodic cleanup of stale entries.
  if (now - lastCleanup > windowMs) {
    for (const [key, timestamps] of rateLimitStore) {
      const fresh = timestamps.filter((t) => now - t < windowMs);
      if (fresh.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, fresh);
      }
    }
    lastCleanup = now;
  }

  const timestamps = (rateLimitStore.get(identifier) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) {
    rateLimitStore.set(identifier, timestamps);
    return false;
  }
  timestamps.push(now);
  rateLimitStore.set(identifier, timestamps);
  return true;
}

/**
 * Best-effort client IP from proxy headers. Falls back to "unknown", in
 * which case all untraceable clients share a single rate-limit bucket.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

/**
 * Simple same-host origin guard against cross-site browser abuse.
 *
 * If an Origin or Referer header is present, its host must match the
 * request Host header (i.e. a same-origin browser fetch). Requests with
 * neither header (server-to-server calls, curl, health checks) are allowed
 * so the API stays usable for non-browser clients.
 */
export function isAllowedOrigin(req: Request): boolean {
  const source = req.headers.get("origin") || req.headers.get("referer");
  if (!source) return true;
  const host = req.headers.get("host");
  if (!host) return false;
  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}
