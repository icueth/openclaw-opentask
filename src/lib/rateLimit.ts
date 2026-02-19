/**
 * Rate Limiting Utility
 * Simple in-memory rate limiting for API endpoints
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

interface RateLimitOptions {
  windowMs: number
  maxRequests: number
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10
}

/**
 * Check if a key is rate limited
 * Returns { limited: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  key: string,
  options: Partial<RateLimitOptions> = {}
): { limited: boolean; remaining: number; resetAt: number } {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const now = Date.now()
  
  const entry = rateLimitStore.get(key)
  
  // If no entry or entry expired, create new
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + opts.windowMs
    rateLimitStore.set(key, {
      count: 1,
      resetAt
    })
    return {
      limited: false,
      remaining: opts.maxRequests - 1,
      resetAt
    }
  }
  
  // Check if over limit
  if (entry.count >= opts.maxRequests) {
    return {
      limited: true,
      remaining: 0,
      resetAt: entry.resetAt
    }
  }
  
  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)
  
  return {
    limited: false,
    remaining: opts.maxRequests - entry.count,
    resetAt: entry.resetAt
  }
}

/**
 * Create a rate limit key from request
 * Uses IP address if available, falls back to a default
 */
export function getRateLimitKey(request: Request): string {
  // Get IP from headers (works with most proxies)
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             'anonymous'
  
  return `rate_limit:${ip}`
}

/**
 * Clean up expired entries (run periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key)
    }
  }
}

// Auto-cleanup every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000)