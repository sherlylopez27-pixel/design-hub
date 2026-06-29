// In-memory rate limiter (for single-instance / Vercel Edge-like use)
// For production multi-instance, replace with Upstash Redis or similar

const store = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60 * 1000  // 1 minute
const MAX_REQUESTS = 5

export function checkRateLimit(key: string): { ok: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true }
  }

  if (entry.count >= MAX_REQUESTS) {
    return { ok: false, retryAfterMs: entry.resetAt - now }
  }

  entry.count++
  return { ok: true }
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  Array.from(store.entries()).forEach(([key, value]) => {
    if (value.resetAt < now) store.delete(key)
  })
}, 5 * 60 * 1000)
