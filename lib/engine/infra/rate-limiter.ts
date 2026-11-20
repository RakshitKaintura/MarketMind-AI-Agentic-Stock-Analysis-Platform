// Token-bucket rate limiter — prevents API abuse

const buckets = new Map<string, { tokens: number; lastRefill: number }>();

export function checkRateLimit(
  identifier: string,
  maxTokens = 15,
  refillWindowMs = 60_000
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  let bucket = buckets.get(identifier);
  if (!bucket || now - bucket.lastRefill > refillWindowMs) {
    bucket = { tokens: maxTokens, lastRefill: now };
    buckets.set(identifier, bucket);
  }
  if (bucket.tokens <= 0) {
    return {
      allowed: false,
      retryAfterMs: bucket.lastRefill + refillWindowMs - now,
    };
  }
  bucket.tokens--;
  return { allowed: true };
}
