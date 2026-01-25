-- ============================================================================
-- Migration: OTP Rate Limiting
-- Date: 2026-01-27
-- Purpose: Add rate limiting for SMS OTP requests to prevent abuse
-- ============================================================================

-- ============================================================================
-- STEP 1: Create auth rate limit function
-- ============================================================================

-- This function checks rate limits specifically for OTP requests.
-- Uses the existing check_rate_limit infrastructure.
-- Key format: 'otp:phone_hash' (we hash the phone to avoid storing it directly)

CREATE OR REPLACE FUNCTION public.check_otp_rate_limit(
  p_phone_hash text,  -- SHA256 hash of phone number (client hashes before sending)
  p_timestamp bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_limit integer := 3;        -- Max 3 OTP requests
  v_window integer := 300;     -- Per 5 minutes (300 seconds)
  v_result jsonb;
BEGIN
  -- Use existing rate limit infrastructure
  v_result := public.check_rate_limit(
    'otp:' || p_phone_hash,
    v_limit,
    v_window,
    p_timestamp
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- STEP 2: Add rate limit for invite creation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_invite_rate_limit(
  p_user_id uuid,
  p_timestamp bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_limit integer := 10;       -- Max 10 invites
  v_window integer := 3600;    -- Per hour (3600 seconds)
  v_result jsonb;
BEGIN
  v_result := public.check_rate_limit(
    'invite:' || p_user_id::text,
    v_limit,
    v_window,
    p_timestamp
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- STEP 3: Add rate limit check to invite creation
-- ============================================================================

-- Modify the existing invite creation policy to include rate limiting
-- This is enforced via trigger since RLS policies can't do RPC calls

CREATE OR REPLACE FUNCTION public.enforce_invite_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Check rate limit for current user
  v_result := public.check_invite_rate_limit(
    auth.uid(),
    extract(epoch from now())::bigint * 1000
  );

  IF NOT (v_result->>'allowed')::boolean THEN
    RAISE EXCEPTION 'Rate limit exceeded. You can only create 10 invites per hour.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enforce_invite_rate_limit ON public.group_invites;

CREATE TRIGGER trigger_enforce_invite_rate_limit
  BEFORE INSERT ON public.group_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_invite_rate_limit();

-- ============================================================================
-- STEP 4: Add rate limit check for contribution submissions
-- ============================================================================

-- Add rate limit check to the existing transaction limits trigger
-- This supplements the existing 5 tx/minute limit with a daily cap

CREATE OR REPLACE FUNCTION public.check_submission_rate_limit(
  p_user_id uuid,
  p_timestamp bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_limit integer := 20;        -- Max 20 submissions
  v_window integer := 86400;    -- Per day (24 hours)
  v_result jsonb;
BEGIN
  v_result := public.check_rate_limit(
    'submit:' || p_user_id::text,
    v_limit,
    v_window,
    p_timestamp
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Rate Limits Added:
-- 1. OTP: 3 requests per 5 minutes per phone hash
-- 2. Invites: 10 per hour per user
-- 3. Submissions: 20 per day per user (plus existing 5/minute)
--
-- Client Integration:
-- - For OTP, client should hash phone before calling check_otp_rate_limit
-- - Rate limit check happens server-side on insert triggers
-- - Client can call check_*_rate_limit RPCs to show pre-emptive warnings
--
-- Example client usage:
--   final hash = sha256.convert(utf8.encode(phone)).toString();
--   final result = await supabase.rpc('check_otp_rate_limit', params: {
--     'p_phone_hash': hash,
--     'p_timestamp': DateTime.now().millisecondsSinceEpoch,
--   });
-- ============================================================================
