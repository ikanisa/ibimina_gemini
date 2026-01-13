/**
 * Rate Limiting Utility for Supabase Edge Functions
 * 
 * Supports multiple backends:
 * 1. Upstash Redis (recommended for production) - REST API based
 * 2. Database-based (fallback) - Uses Supabase table
 * 
 * Usage:
 *   const rateLimit = await checkRateLimit(clientId, options)
 *   if (!rateLimit.allowed) {
 *     return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 })
 *   }
 */

interface RateLimitOptions {
  limit?: number; // requests per window
  windowSeconds?: number; // time window in seconds
  institutionId?: string; // for per-institution limits
  identifier?: string; // client identifier (API key, IP, etc.)
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // timestamp when limit resets
  limit: number;
}

// Default rate limits
const DEFAULT_LIMIT = 100; // requests per minute
const DEFAULT_WINDOW_SECONDS = 60; // 1 minute

// Per-institution rate limits (can be configured in database)
const INSTITUTION_RATE_LIMITS: Record<string, { limit: number; windowSeconds: number }> = {
  // Example: 'institution-id-1': { limit: 200, windowSeconds: 60 }
  // Load from institution_settings table in production
};

/**
 * Get rate limit configuration for an institution
 */
async function getInstitutionRateLimit(
  institutionId: string | undefined,
  supabase: any
): Promise<{ limit: number; windowSeconds: number }> {
  if (!institutionId) {
    return { limit: DEFAULT_LIMIT, windowSeconds: DEFAULT_WINDOW_SECONDS };
  }

  // Check cache first
  if (INSTITUTION_RATE_LIMITS[institutionId]) {
    return INSTITUTION_RATE_LIMITS[institutionId];
  }

  // Load from database
  try {
    const { data, error } = await supabase
      .from('institution_settings')
      .select('sms_rate_limit, sms_rate_limit_window_seconds')
      .eq('institution_id', institutionId)
      .single();

    if (!error && data) {
      const config = {
        limit: data.sms_rate_limit || DEFAULT_LIMIT,
        windowSeconds: data.sms_rate_limit_window_seconds || DEFAULT_WINDOW_SECONDS,
      };
      INSTITUTION_RATE_LIMITS[institutionId] = config;
      return config;
    }
  } catch (err) {
    console.warn('Failed to load institution rate limit config:', err);
  }

  return { limit: DEFAULT_LIMIT, windowSeconds: DEFAULT_WINDOW_SECONDS };
}

/**
 * Rate limiting using Upstash Redis (REST API)
 * Works across multiple Edge Function instances
 */
async function checkRateLimitUpstash(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const upstashUrl = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const upstashToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

  if (!upstashUrl || !upstashToken) {
    // Fallback to database if Upstash not configured
    return checkRateLimitDatabase(identifier, options);
  }

  const limit = options.limit || DEFAULT_LIMIT;
  const windowSeconds = options.windowSeconds || DEFAULT_WINDOW_SECONDS;
  const key = `rate_limit:${options.institutionId || 'global'}:${identifier}`;

  try {
    // Use Upstash REST API for rate limiting
    // Implementation: Sliding window log algorithm
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    // Get current count using Redis EVAL (via REST API)
    const response = await fetch(`${upstashUrl}/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${upstashToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        // Remove old entries
        ['ZREMRANGEBYSCORE', key, '0', windowStart.toString()],
        // Count current entries
        ['ZCARD', key],
        // Add current request
        ['ZADD', key, now.toString(), `${now}-${Math.random()}`],
        // Set expiry
        ['EXPIRE', key, windowSeconds.toString()],
      ]),
    });

    if (!response.ok) {
      console.warn('Upstash Redis rate limit check failed, falling back to database');
      return checkRateLimitDatabase(identifier, options);
    }

    const results = await response.json();
    const currentCount = results[1]?.result || 0;
    const newCount = currentCount + 1;

    const resetAt = now + windowSeconds * 1000;

    return {
      allowed: newCount <= limit,
      remaining: Math.max(0, limit - newCount),
      resetAt,
      limit,
    };
  } catch (error) {
    console.error('Upstash Redis error:', error);
    // Fallback to database
    return checkRateLimitDatabase(identifier, options);
  }
}

/**
 * Rate limiting using database (fallback)
 * Uses a dedicated rate_limit_tracking table
 */
async function checkRateLimitDatabase(
  identifier: string,
  options: RateLimitOptions,
  supabase?: any
): Promise<RateLimitResult> {
  // If supabase client not provided, we can't use database fallback
  if (!supabase) {
    // Last resort: in-memory (single instance only)
    return checkRateLimitInMemory(identifier, options);
  }

  const limit = options.limit || DEFAULT_LIMIT;
  const windowSeconds = options.windowSeconds || DEFAULT_WINDOW_SECONDS;
  const key = `${options.institutionId || 'global'}:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  try {
    // Use RPC function for atomic rate limit check
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
      p_timestamp: now,
    });

    if (error) {
      console.error('Rate limit RPC error:', error);
      // Fallback to in-memory
      return checkRateLimitInMemory(identifier, options);
    }

    return {
      allowed: data.allowed || false,
      remaining: data.remaining || 0,
      resetAt: data.reset_at || now + windowSeconds * 1000,
      limit,
    };
  } catch (err) {
    console.error('Database rate limit error:', err);
    // Fallback to in-memory
    return checkRateLimitInMemory(identifier, options);
  }
}

/**
 * In-memory rate limiting (single instance only)
 * Used as last resort fallback
 */
const inMemoryRateLimit = new Map<string, { timestamps: number[]; resetAt: number }>();

function checkRateLimitInMemory(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const limit = options.limit || DEFAULT_LIMIT;
  const windowSeconds = options.windowSeconds || DEFAULT_WINDOW_SECONDS;
  const key = `${options.institutionId || 'global'}:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  let entry = inMemoryRateLimit.get(key);
  if (!entry || entry.resetAt < now) {
    entry = { timestamps: [], resetAt: now + windowSeconds * 1000 };
    inMemoryRateLimit.set(key, entry);
  }

  // Remove old timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  // Check limit
  const currentCount = entry.timestamps.length;
  const allowed = currentCount < limit;

  if (allowed) {
    entry.timestamps.push(now);
  }

  // Cleanup old entries periodically
  if (Math.random() < 0.01) {
    for (const [k, v] of inMemoryRateLimit.entries()) {
      if (v.resetAt < now && v.timestamps.length === 0) {
        inMemoryRateLimit.delete(k);
      }
    }
  }

  return {
    allowed,
    remaining: Math.max(0, limit - currentCount - (allowed ? 1 : 0)),
    resetAt: entry.resetAt,
    limit,
  };
}

/**
 * Main rate limit check function
 * Automatically selects the best available backend
 */
export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {},
  supabase?: any
): Promise<RateLimitResult> {
  // Get institution-specific limits if provided
  if (options.institutionId && supabase) {
    const institutionConfig = await getInstitutionRateLimit(options.institutionId, supabase);
    options.limit = options.limit || institutionConfig.limit;
    options.windowSeconds = options.windowSeconds || institutionConfig.windowSeconds;
  }

  // Try Upstash Redis first (best for production)
  const upstashUrl = Deno.env.get('UPSTASH_REDIS_REST_URL');
  if (upstashUrl) {
    return checkRateLimitUpstash(identifier, options);
  }

  // Fallback to database
  if (supabase) {
    return checkRateLimitDatabase(identifier, options, supabase);
  }

  // Last resort: in-memory (single instance)
  return checkRateLimitInMemory(identifier, options);
}

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
    'Retry-After': result.allowed
      ? '0'
      : Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
  };
}
