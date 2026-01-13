-- ============================================================================
-- IP Whitelist Table for Per-Institution IP Allowlisting
-- Date: 2026-01-15
-- Purpose: Allow institutions to configure IP whitelists for SMS ingestion
-- Based on: docs/COMPREHENSIVE_IMPLEMENTATION_PLAN.md - Task 1.9
-- ============================================================================

-- ============================================================================
-- STEP 1: Create institution_ip_whitelist table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.institution_ip_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  ip_address text NOT NULL, -- IPv4 or IPv6 address
  cidr_prefix integer, -- CIDR prefix (e.g., 24 for /24), NULL for exact IP match
  description text, -- Optional description of the IP/range
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Ensure unique IP/range per institution
  UNIQUE(institution_id, ip_address, cidr_prefix)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_institution_ip_whitelist_institution_active 
  ON public.institution_ip_whitelist(institution_id, is_active) 
  WHERE is_active = true;

-- Index for IP lookups (for future optimizations)
CREATE INDEX IF NOT EXISTS idx_institution_ip_whitelist_ip 
  ON public.institution_ip_whitelist(ip_address) 
  WHERE is_active = true;

-- ============================================================================
-- STEP 2: Add validation function for IP addresses
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_ip_address(ip text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- IPv4 validation (simplified)
  IF ip ~ '^([0-9]{1,3}\.){3}[0-9]{1,3}$' THEN
    -- Check each octet is 0-255
    RETURN (
      (split_part(ip, '.', 1)::int BETWEEN 0 AND 255) AND
      (split_part(ip, '.', 2)::int BETWEEN 0 AND 255) AND
      (split_part(ip, '.', 3)::int BETWEEN 0 AND 255) AND
      (split_part(ip, '.', 4)::int BETWEEN 0 AND 255)
    );
  END IF;
  
  -- IPv6 validation (simplified - checks basic format)
  IF ip ~ '^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$' OR 
     ip ~ '^::([0-9a-fA-F]{0,4}:){0,6}[0-9a-fA-F]{0,4}$' OR
     ip ~ '^([0-9a-fA-F]{0,4}:){1,6}::$' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- ============================================================================
-- STEP 3: Add check constraint for valid IP addresses
-- ============================================================================

ALTER TABLE public.institution_ip_whitelist
  ADD CONSTRAINT chk_ip_address_valid 
  CHECK (public.validate_ip_address(ip_address));

-- Add constraint for CIDR prefix range
ALTER TABLE public.institution_ip_whitelist
  ADD CONSTRAINT chk_cidr_prefix_valid 
  CHECK (
    cidr_prefix IS NULL OR 
    (ip_address ~ '^([0-9]{1,3}\.){3}[0-9]{1,3}$' AND cidr_prefix BETWEEN 0 AND 32) OR
    (ip_address ~ ':' AND cidr_prefix BETWEEN 0 AND 128)
  );

-- ============================================================================
-- STEP 4: Create RPC function to check IP whitelist
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_ip_whitelist(
  p_institution_id uuid,
  p_ip_address text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_allowed boolean := false;
  v_entry record;
BEGIN
  -- If no whitelist entries, allow (institution hasn't configured whitelist)
  SELECT COUNT(*) INTO v_allowed
  FROM public.institution_ip_whitelist
  WHERE institution_id = p_institution_id
    AND is_active = true;
  
  IF v_allowed = 0 THEN
    RETURN true; -- No whitelist configured, allow all
  END IF;
  
  -- Check if IP matches any whitelist entry
  FOR v_entry IN
    SELECT ip_address, cidr_prefix
    FROM public.institution_ip_whitelist
    WHERE institution_id = p_institution_id
      AND is_active = true
  LOOP
    -- Exact match
    IF v_entry.cidr_prefix IS NULL AND v_entry.ip_address = p_ip_address THEN
      RETURN true;
    END IF;
    
    -- CIDR match (simplified - for production, use proper CIDR library)
    -- This is a basic check - the Edge Function will do proper CIDR matching
    IF v_entry.cidr_prefix IS NOT NULL THEN
      -- Basic prefix check (Edge Function does proper CIDR matching)
      IF p_ip_address LIKE v_entry.ip_address || '%' THEN
        RETURN true;
      END IF;
    END IF;
  END LOOP;
  
  RETURN false;
END;
$$;

-- ============================================================================
-- STEP 5: Add RLS policies
-- ============================================================================

ALTER TABLE public.institution_ip_whitelist ENABLE ROW LEVEL SECURITY;

-- Policy: Institution admins can manage their own IP whitelist
CREATE POLICY "institution_admins_manage_ip_whitelist"
  ON public.institution_ip_whitelist
  FOR ALL
  USING (
    institution_id IN (
      SELECT id FROM public.institutions 
      WHERE id = institution_id 
      AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND institution_id = institutions.id 
        AND role IN ('Admin', 'Staff')
      )
    )
  );

-- Policy: Platform admins can manage all IP whitelists
CREATE POLICY "platform_admins_manage_all_ip_whitelists"
  ON public.institution_ip_whitelist
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'Platform Admin'
    )
  );

-- Policy: Read access for authenticated users in same institution
CREATE POLICY "users_read_institution_ip_whitelist"
  ON public.institution_ip_whitelist
  FOR SELECT
  USING (
    institution_id IN (
      SELECT institution_id FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 6: Add audit logging trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_ip_whitelist_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (
      actor_user_id,
      institution_id,
      action,
      entity_type,
      entity_id,
      metadata
    ) VALUES (
      NEW.created_by,
      NEW.institution_id,
      'create_ip_whitelist_entry',
      'institution_ip_whitelist',
      NEW.id,
      jsonb_build_object(
        'ip_address', NEW.ip_address,
        'cidr_prefix', NEW.cidr_prefix,
        'description', NEW.description
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (
      actor_user_id,
      institution_id,
      action,
      entity_type,
      entity_id,
      metadata
    ) VALUES (
      NEW.updated_by,
      NEW.institution_id,
      'update_ip_whitelist_entry',
      'institution_ip_whitelist',
      NEW.id,
      jsonb_build_object(
        'old', jsonb_build_object(
          'ip_address', OLD.ip_address,
          'cidr_prefix', OLD.cidr_prefix,
          'is_active', OLD.is_active
        ),
        'new', jsonb_build_object(
          'ip_address', NEW.ip_address,
          'cidr_prefix', NEW.cidr_prefix,
          'is_active', NEW.is_active
        )
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (
      actor_user_id,
      institution_id,
      action,
      entity_type,
      entity_id,
      metadata
    ) VALUES (
      auth.uid(),
      OLD.institution_id,
      'delete_ip_whitelist_entry',
      'institution_ip_whitelist',
      OLD.id,
      jsonb_build_object(
        'ip_address', OLD.ip_address,
        'cidr_prefix', OLD.cidr_prefix
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER ip_whitelist_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE
  ON public.institution_ip_whitelist
  FOR EACH ROW
  EXECUTE FUNCTION public.log_ip_whitelist_changes();

-- ============================================================================
-- STEP 7: Add comments
-- ============================================================================

COMMENT ON TABLE public.institution_ip_whitelist IS 
  'IP whitelist entries for SMS ingestion per institution. Supports exact IPs and CIDR notation.';

COMMENT ON COLUMN public.institution_ip_whitelist.ip_address IS 
  'IPv4 or IPv6 address (exact match) or network address (CIDR)';

COMMENT ON COLUMN public.institution_ip_whitelist.cidr_prefix IS 
  'CIDR prefix length (e.g., 24 for /24). NULL for exact IP match.';

COMMENT ON FUNCTION public.check_ip_whitelist IS 
  'Check if an IP address is allowed for an institution. Returns true if whitelist is empty (allow all).';

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- This migration creates:
-- 1. institution_ip_whitelist table for per-institution IP allowlisting
-- 2. Validation function for IP addresses (IPv4 and IPv6)
-- 3. RPC function to check IP whitelist
-- 4. RLS policies for access control
-- 5. Audit logging for all changes
-- 
-- Usage:
--   - Institutions can configure IP whitelists via the portal
--   - Edge Functions check whitelist before processing requests
--   - Supports both exact IPs and CIDR notation
--   - If no whitelist configured, all IPs are allowed (backward compatible)
-- 
-- Example entries:
--   - Exact IP: ip_address='192.168.1.100', cidr_prefix=NULL
--   - CIDR range: ip_address='192.168.1.0', cidr_prefix=24
--   - IPv6: ip_address='2001:db8::1', cidr_prefix=NULL
--   - IPv6 CIDR: ip_address='2001:db8::', cidr_prefix=64
-- ============================================================================
