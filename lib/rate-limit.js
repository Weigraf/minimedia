import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Fails open (allows all requests) when UPSTASH_* env vars are not set.
// Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to Vercel env vars to enable.
const configured = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
)

const redis = configured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

function makeLimiter(requests, window, prefix) {
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `tt:${prefix}`,
    analytics: false,
  })
}

// 5 contact submissions per IP per hour
export const contactLimiter = makeLimiter(5, '1 h', 'contact')

// 3 signup notifications per IP per hour
export const signupLimiter = makeLimiter(3, '1 h', 'signup')

// Extracts the real client IP from Vercel/proxy headers
export function getClientIP(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

// Convenience: run a limiter and return a 429 Response on failure, null on pass
export async function checkLimit(limiter, key) {
  if (!limiter) return null // not configured — allow
  const { success, limit, remaining, reset } = await limiter.limit(key)
  if (success) return null
  const retryAfter = Math.ceil((reset - Date.now()) / 1000)
  const res = Response.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(reset),
      },
    }
  )
  return res
}
