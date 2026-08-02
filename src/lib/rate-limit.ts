const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;
// Expired entries only got overwritten when that same user came back, so
// the map grew by one entry per distinct user forever. Sweep periodically
// instead. This is still an in-memory, per-instance limiter (see note
// below) — the sweep just stops it from leaking memory within an instance.
const SWEEP_INTERVAL_MS = 5 * 60_000;

let lastSweep = Date.now();

function sweepExpiredEntries(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}

// NOTE: this limiter is per-process, not distributed. On a platform that
// runs multiple concurrent instances (e.g. Vercel serverless), each
// instance enforces its own independent limit, so the effective limit is
// up to (MAX_REQUESTS * concurrent instances) rather than MAX_REQUESTS.
// If the OpenAI-spend protection this guards needs a hard ceiling, this
// needs to move to a shared store (e.g. Upstash/Redis).
export function checkRateLimit(userId: string) {
  const now = Date.now();
  sweepExpiredEntries(now);

  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true as const };
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false as const,
      retryAfterSeconds,
    };
  }

  entry.count++;
  return { allowed: true as const };
}
