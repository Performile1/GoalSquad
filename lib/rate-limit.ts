import { NextRequest } from 'next/server';

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(request: Request | NextRequest, key: string, limit = 30, windowMs = 60_000) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const address = forwarded || request.headers.get('x-real-ip') || 'unknown';
  const bucketKey = `${key}:${address}`;
  const now = Date.now();
  const current = buckets.get(bucketKey);
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current;

  bucket.count += 1;
  buckets.set(bucketKey, bucket);

  if (buckets.size > 10_000) {
    for (const [entryKey, entry] of buckets) {
      if (entry.resetAt <= now) buckets.delete(entryKey);
    }
  }

  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
  };
}
