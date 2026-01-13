-- ============================================================================
-- Rate Limiting Table and Functions
-- Date: 2026-01-15
-- Purpose: Database-based rate limiting fallback for Edge Functions
-- Based on: docs/COMPREHENSIVE_IMPLEMENTATION_PLAN.md - Task 1.5
-- ============================================================================

-- ============================================================================
-- STEP 1: Create rate limit tracking table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL, -- Format: "institution_id:identifier" or "global:identifier"
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  last_request_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(key, window_start)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_key_window 
  ON public.rate_limit_tracking(key, window_start DESC);

-- Index for cleanup of old entries
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_window_end 
  ON public.rate_limit_tracking(window_end) 
  WHERE window_end < now();

-- ============================================================================
-- STEP 2: Create RPC function for atomic rate limit check
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer,
  p_timestamp bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_window_start timestamptz;
  v_window_end timestamptz;
  v_current_count integer;
  v_allowed boolean;
  v_remaining integer;
  v_reset_at bigint;
BEGIN
  -- Calculate window boundaries
  v_window_start := to_timestamp(p_timestamp / 1000) - (p_window_seconds || ' seconds')::interval;
  v_window_end := to_timestamp(p_timestamp / 1000);

  -- Get or create rate limit entry for this window
  INSERT INTO public.rate_limit_tracking (key, request_count, window_start, window_end, last_request_at)
  VALUES (p_key, 1, v_window_start, v_window_end, to_timestamp(p_timestamp / 1000))
  ON CONFLICT (key, window_start) 
  DO UPDATE SET
    request_count = rate_limit_tracking.request_count + 1,
    last_request_at = to_timestamp(p_timestamp / 1000),
    updated_at = now()
  RETURNING request_count INTO v_current_count;

  -- Check if limit exceeded
  v_allowed := v_current_count <= p_limit;
  v_remaining := GREATEST(0, p_limit - v_current_count);
  v_reset_at := (EXTRACT(EPOCH FROM v_window_end) * 1000)::bigint;

  -- Cleanup old entries (older than 2x window size)
  DELETE FROM public.rate_limit_tracking
  WHERE window_end < now() - (p_window_seconds * 2 || ' seconds')::interval;

  -- Return result
  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'remaining', v_remaining,
    'reset_at', v_reset_at,
    'limit', p_limit,
    'current_count', v_current_count
  );
END;
$$;

-- ============================================================================
-- STEP 3: Add rate limit configuration to institution_settings
-- ============================================================================

-- Add rate limit columns to institution_settings if they don't exist
ALTER TABLE public.institution_settings
  ADD COLUMN IF NOT EXISTS sms_rate_limit integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS sms_rate_limit_window_seconds integer DEFAULT 60,
  ADD COLUMN IF NOT EXISTS api_rate_limit integer DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS api_rate_limit_window_seconds integer DEFAULT 60;

-- Add comments
COMMENT ON COLUMN public.institution_settings.sms_rate_limit IS 
  'Maximum number of SMS ingest requests per window (default: 100)';
COMMENT ON COLUMN public.institution_settings.sms_rate_limit_window_seconds IS 
  'Time window in seconds for SMS rate limit (default: 60)';
COMMENT ON COLUMN public.institution_settings.api_rate_limit IS 
  'Maximum number of API requests per window (default: 1000)';
COMMENT ON COLUMN public.institution_settings.api_rate_limit_window_seconds IS 
  'Time window in seconds for API rate limit (default: 60)';

-- ============================================================================
-- STEP 4: Create cleanup function for old rate limit entries
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete entries older than 1 hour
  DELETE FROM public.rate_limit_tracking
  WHERE window_end < now() - INTERVAL '1 hour';
END;
$$;

-- ============================================================================
-- STEP 5: Create scheduled job for cleanup (if pg_cron extension available)
-- ============================================================================

-- Note: This requires pg_cron extension to be enabled
-- Run manually or via Supabase cron jobs
-- SELECT cron.schedule('cleanup-rate-limits', '0 * * * *', 'SELECT public.cleanup_old_rate_limits()');

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- This migration creates:
-- 1. rate_limit_tracking table for database-based rate limiting
-- 2. check_rate_limit() RPC function for atomic rate limit checks
-- 3. Rate limit configuration columns in institution_settings
-- 4. Cleanup function for old entries
-- 
-- Usage in Edge Functions:
--   const { data } = await supabase.rpc('check_rate_limit', {
--     p_key: 'institution-id:api-key',
--     p_limit: 100,
--     p_window_seconds: 60,
--     p_timestamp: Date.now()
--   });
-- 
-- For production, prefer Upstash Redis for better performance and multi-instance support.
-- This database-based solution is a reliable fallback.
-- ============================================================================
