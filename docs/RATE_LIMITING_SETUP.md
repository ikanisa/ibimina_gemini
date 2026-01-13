# Rate Limiting Setup Guide

## Overview

Rate limiting has been implemented for Edge Functions to prevent abuse and ensure fair usage. The system supports multiple backends:

1. **Upstash Redis** (Recommended for production) - REST API based, works across multiple instances
2. **Database-based** (Fallback) - Uses Supabase table for rate limit tracking
3. **In-memory** (Last resort) - Single instance only

## Configuration

### Option 1: Upstash Redis (Recommended)

1. Sign up for [Upstash Redis](https://upstash.com/)
2. Create a new Redis database
3. Get your REST URL and Token from the dashboard
4. Add environment variables to Supabase Edge Functions:

```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### Option 2: Database-based (Default Fallback)

The system will automatically fall back to database-based rate limiting if Upstash is not configured. This requires:

1. Run the migration: `supabase/migrations/20260115000003_rate_limit_table.sql`
2. The `check_rate_limit()` RPC function will be available

### Option 3: In-memory (Development Only)

If neither Redis nor database is available, the system falls back to in-memory rate limiting. This only works for single-instance deployments.

## Per-Institution Rate Limits

Rate limits can be configured per institution in the `institution_settings` table:

```sql
UPDATE institution_settings
SET 
  sms_rate_limit = 200,              -- 200 requests per minute
  sms_rate_limit_window_seconds = 60  -- 1 minute window
WHERE institution_id = 'your-institution-id';
```

## Rate Limit Headers

All responses include rate limit headers:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds to wait before retrying (only on 429)

## Default Limits

- **SMS Ingest**: 100 requests per minute per API key/IP
- **API Endpoints**: 1000 requests per minute per user

## Monitoring

Check rate limit usage:

```sql
-- View rate limit tracking
SELECT * FROM rate_limit_tracking
ORDER BY last_request_at DESC
LIMIT 100;

-- Cleanup old entries
SELECT public.cleanup_old_rate_limits();
```

## Testing

Test rate limiting:

```bash
# Send 101 requests quickly
for i in {1..101}; do
  curl -X POST https://your-project.supabase.co/functions/v1/sms-ingest \
    -H "x-api-key: your-key" \
    -H "Content-Type: application/json" \
    -d '{"device_identifier":"test","sender_phone":"+250...","sms_text":"test","received_at":"2026-01-15T10:00:00Z"}'
done

# The 101st request should return 429
```

## Troubleshooting

### Rate limits not working

1. Check environment variables are set correctly
2. Verify migration has been run
3. Check Supabase logs for errors
4. Verify Upstash Redis connection (if using)

### Too many 429 errors

1. Increase rate limits in `institution_settings`
2. Check for misconfigured clients sending too many requests
3. Review rate limit headers to understand current usage

## Files

- `supabase/functions/_shared/rate-limit.ts` - Rate limiting utility
- `supabase/migrations/20260115000003_rate_limit_table.sql` - Database schema
- `supabase/functions/sms-ingest/index.ts` - Example usage
