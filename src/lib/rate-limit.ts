const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

export function checkRateLimit(userId: string) {
  const now = Date.now();
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
