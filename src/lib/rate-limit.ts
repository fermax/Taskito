import { LRUCache } from 'lru-cache'

export interface RateLimitOptions {
  interval: number // in ms
  maxRequests: number
}

export function createRateLimiter(options: RateLimitOptions) {
  const cache = new LRUCache<string, number[]>({
    max: 500,
    ttl: options.interval,
  })

  return {
    check: (key: string): { allowed: boolean; remaining: number; reset: number } => {
      const now = Date.now()
      const timestamps = cache.get(key) || []
      const windowStart = now - options.interval

      const validTimestamps = timestamps.filter((t) => t > windowStart)
      const remaining = Math.max(0, options.maxRequests - validTimestamps.length)
      const oldest = validTimestamps.length > 0 ? validTimestamps[0] : now

      if (validTimestamps.length >= options.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          reset: oldest + options.interval,
        }
      }

      validTimestamps.push(now)
      cache.set(key, validTimestamps)

      return {
        allowed: true,
        remaining: options.maxRequests - validTimestamps.length,
        reset: windowStart + options.interval,
      }
    },
  }
}
