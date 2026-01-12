/**
 * Client-Side Rate Limiter
 * Prevents excessive API calls and provides feedback
 */

// ============================================================================
// TYPES
// ============================================================================

interface RateLimitEntry {
    count: number;
    firstRequest: number;
    blocked: boolean;
    blockedUntil?: number;
}

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    blockDurationMs?: number;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfter?: number;
}

// ============================================================================
// RATE LIMITER CLASS
// ============================================================================

class RateLimiter {
    private limits: Map<string, RateLimitEntry> = new Map();
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = {
            ...config,
            blockDurationMs: config.blockDurationMs ?? config.windowMs * 2,
        };
    }

    check(key: string): RateLimitResult {
        const now = Date.now();
        const entry = this.limits.get(key);

        // If no entry, allow and create new
        if (!entry) {
            this.limits.set(key, {
                count: 1,
                firstRequest: now,
                blocked: false,
            });
            return {
                allowed: true,
                remaining: this.config.maxRequests - 1,
                resetAt: now + this.config.windowMs,
            };
        }

        // If blocked, check if block has expired
        if (entry.blocked && entry.blockedUntil) {
            if (now < entry.blockedUntil) {
                return {
                    allowed: false,
                    remaining: 0,
                    resetAt: entry.blockedUntil,
                    retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
                };
            }
            // Block expired, reset
            this.limits.set(key, {
                count: 1,
                firstRequest: now,
                blocked: false,
            });
            return {
                allowed: true,
                remaining: this.config.maxRequests - 1,
                resetAt: now + this.config.windowMs,
            };
        }

        // Check if window has passed
        if (now - entry.firstRequest > this.config.windowMs) {
            // Window expired, reset
            this.limits.set(key, {
                count: 1,
                firstRequest: now,
                blocked: false,
            });
            return {
                allowed: true,
                remaining: this.config.maxRequests - 1,
                resetAt: now + this.config.windowMs,
            };
        }

        // Within window, check count
        if (entry.count >= this.config.maxRequests) {
            // Rate limit exceeded, block
            const blockedUntil = now + this.config.blockDurationMs!;
            this.limits.set(key, {
                ...entry,
                blocked: true,
                blockedUntil,
            });
            return {
                allowed: false,
                remaining: 0,
                resetAt: blockedUntil,
                retryAfter: Math.ceil(this.config.blockDurationMs! / 1000),
            };
        }

        // Increment count
        entry.count++;
        this.limits.set(key, entry);

        return {
            allowed: true,
            remaining: this.config.maxRequests - entry.count,
            resetAt: entry.firstRequest + this.config.windowMs,
        };
    }

    reset(key: string): void {
        this.limits.delete(key);
    }

    clear(): void {
        this.limits.clear();
    }
}

// ============================================================================
// PRESET LIMITERS
// ============================================================================

// Auth operations: 10 attempts per minute
export const authLimiter = new RateLimiter({
    maxRequests: 10,
    windowMs: 60 * 1000,
    blockDurationMs: 5 * 60 * 1000, // 5 min block
});

// API operations: 100 requests per minute
export const apiLimiter = new RateLimiter({
    maxRequests: 100,
    windowMs: 60 * 1000,
});

// Search/filter operations: 30 requests per minute
export const searchLimiter = new RateLimiter({
    maxRequests: 30,
    windowMs: 60 * 1000,
});

// Export operations: 5 per minute
export const exportLimiter = new RateLimiter({
    maxRequests: 5,
    windowMs: 60 * 1000,
    blockDurationMs: 2 * 60 * 1000,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check rate limit and throw if exceeded
 */
export function checkRateLimit(
    limiter: RateLimiter,
    key: string,
    errorMessage = 'Rate limit exceeded'
): RateLimitResult {
    const result = limiter.check(key);
    if (!result.allowed) {
        const error = new Error(
            `${errorMessage}. Please try again in ${result.retryAfter} seconds.`
        );
        (error as any).retryAfter = result.retryAfter;
        (error as any).code = 'RATE_LIMIT_EXCEEDED';
        throw error;
    }
    return result;
}

/**
 * Create a rate-limited version of an async function
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    limiter: RateLimiter,
    keyGenerator: (...args: Parameters<T>) => string
): T {
    return (async (...args: Parameters<T>) => {
        const key = keyGenerator(...args);
        checkRateLimit(limiter, key);
        return fn(...args);
    }) as T;
}

export { RateLimiter };
export default RateLimiter;
