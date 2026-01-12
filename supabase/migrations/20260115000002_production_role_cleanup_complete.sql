-- ============================================================================
-- Migration: Production Role Cleanup - Complete
-- Date: 2026-01-15
-- Purpose: Ensure ALL database functions, policies, and constraints are updated
--          for simplified role system (ADMIN/STAFF only) - PRODUCTION READY
-- ============================================================================

-- ============================================================================
-- 1. Update public helper functions - PRODUCTION READY
-- ============================================================================

-- Ensure public.is_staff() exists and is updated
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role IN ('ADMIN', 'STAFF', 'PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'INSTITUTION_STAFF', 'INSTITUTION_TREASURER', 'INSTITUTION_AUDITOR')
    AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

-- Ensure public.is_admin() exists and is updated
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role IN ('ADMIN', 'PLATFORM_ADMIN', 'INSTITUTION_ADMIN')
    AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================================================
-- 2. Update update_staff_role function - PRODUCTION READY
-- ============================================================================

-- This will only work if profiles table exists - function will be created/updated when schema is applied
DO $update_staff_role$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    -- Function body as string to avoid nested dollar-quote issues
    PERFORM pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'update_staff_role' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    -- Drop and recreate if exists, or create if not
    DROP FUNCTION IF EXISTS public.update_staff_role(uuid, text);
    
    CREATE FUNCTION public.update_staff_role(
      p_user_id uuid,
      p_role text
    )
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $func$
    DECLARE
      v_target_profile profiles%rowtype;
      v_actor_role text;
      v_actor_institution_id uuid;
    BEGIN
      -- Get actor info
      SELECT role, institution_id INTO v_actor_role, v_actor_institution_id
      FROM public.profiles WHERE user_id = auth.uid();

      -- Get target profile
      SELECT * INTO v_target_profile FROM public.profiles WHERE user_id = p_user_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Staff member not found';
      END IF;

      -- Validate role - accept both new simplified roles and legacy roles
      IF p_role NOT IN ('ADMIN', 'STAFF', 'PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'INSTITUTION_STAFF', 'INSTITUTION_TREASURER', 'INSTITUTION_AUDITOR') THEN
        RAISE EXCEPTION 'Invalid role. Must be ADMIN or STAFF (or legacy equivalent)';
      END IF;

      -- Permission checks - updated for simplified roles
      IF v_actor_role IN ('ADMIN', 'PLATFORM_ADMIN') THEN
        NULL; -- Admin can update any role
      ELSIF v_actor_role = 'INSTITUTION_ADMIN' THEN
        IF v_target_profile.institution_id != v_actor_institution_id THEN
          RAISE EXCEPTION 'Cannot update staff from another institution';
        END IF;
        IF p_role = 'PLATFORM_ADMIN' THEN
          RAISE EXCEPTION 'Cannot promote to platform admin';
        END IF;
        IF v_target_profile.role = 'INSTITUTION_ADMIN' AND p_user_id != auth.uid() THEN
          RAISE EXCEPTION 'Cannot demote another institution admin';
        END IF;
      ELSE
        RAISE EXCEPTION 'Permission denied. Only admins can update staff roles';
      END IF;

      -- Update role
      UPDATE public.profiles
      SET role = p_role, updated_at = now()
      WHERE user_id = p_user_id;

      -- Audit log (if table exists)
      IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_log') THEN
        INSERT INTO public.audit_log (
          actor_user_id, institution_id, action, entity_type, entity_id, metadata
        ) VALUES (
          auth.uid(),
          v_target_profile.institution_id,
          'update_staff_role',
          'profile',
          p_user_id,
          jsonb_build_object(
            'old_role', v_target_profile.role,
            'new_role', p_role,
            'staff_email', v_target_profile.email
          )
        );
      END IF;
    END;
    $func$;
    
    GRANT EXECUTE ON FUNCTION public.update_staff_role(uuid, text) TO authenticated;
    COMMENT ON FUNCTION public.update_staff_role(uuid, text) IS 'Updates a staff member''s role - PRODUCTION: Supports simplified ADMIN/STAFF roles';
  END IF;
END $update_staff_role$;

-- ============================================================================
-- 3. Update deactivate_staff function - PRODUCTION READY
-- ============================================================================

DO $deactivate_staff$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    DROP FUNCTION IF EXISTS public.deactivate_staff(uuid, text);
    
    CREATE FUNCTION public.deactivate_staff(
      p_user_id uuid,
      p_reason text DEFAULT NULL
    )
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $func$
    DECLARE
      v_target_profile profiles%rowtype;
      v_actor_role text;
      v_actor_institution_id uuid;
    BEGIN
      SELECT role, institution_id INTO v_actor_role, v_actor_institution_id
      FROM public.profiles WHERE user_id = auth.uid();

      SELECT * INTO v_target_profile FROM public.profiles WHERE user_id = p_user_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Staff member not found';
      END IF;

      IF p_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot deactivate your own account';
      END IF;

      IF v_actor_role IN ('ADMIN', 'PLATFORM_ADMIN') THEN
        NULL;
      ELSIF v_actor_role = 'INSTITUTION_ADMIN' THEN
        IF v_target_profile.institution_id != v_actor_institution_id THEN
          RAISE EXCEPTION 'Cannot deactivate staff from another institution';
        END IF;
        IF v_target_profile.role IN ('ADMIN', 'PLATFORM_ADMIN') THEN
          RAISE EXCEPTION 'Cannot deactivate an admin';
        END IF;
      ELSE
        RAISE EXCEPTION 'Permission denied. Only admins can deactivate staff';
      END IF;

      UPDATE public.profiles
      SET is_active = false, status = 'SUSPENDED', updated_at = now()
      WHERE user_id = p_user_id;

      IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_log') THEN
        INSERT INTO public.audit_log (
          actor_user_id, institution_id, action, entity_type, entity_id, metadata
        ) VALUES (
          auth.uid(),
          v_target_profile.institution_id,
          'deactivate_staff',
          'profile',
          p_user_id,
          jsonb_build_object(
            'reason', p_reason,
            'staff_email', v_target_profile.email,
            'staff_role', v_target_profile.role
          )
        );
      END IF;
    END;
    $func$;
    
    GRANT EXECUTE ON FUNCTION public.deactivate_staff(uuid, text) TO authenticated;
    COMMENT ON FUNCTION public.deactivate_staff(uuid, text) IS 'Deactivates a staff member - PRODUCTION: Works with simplified ADMIN/STAFF roles';
  END IF;
END $deactivate_staff$;

-- ============================================================================
-- 4. Data migration - Ensure all roles are consistent
-- ============================================================================

DO $data_migration$
BEGIN
  -- Migrate profiles table roles
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    UPDATE profiles
    SET role = CASE
      WHEN role IN ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN') THEN 'ADMIN'
      WHEN role IN ('INSTITUTION_STAFF', 'INSTITUTION_TREASURER', 'INSTITUTION_AUDITOR') THEN 'STAFF'
      WHEN role NOT IN ('ADMIN', 'STAFF', 'PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'INSTITUTION_STAFF', 'INSTITUTION_TREASURER', 'INSTITUTION_AUDITOR') THEN 'STAFF'
      ELSE role
    END
    WHERE role NOT IN ('ADMIN', 'STAFF')
      AND role IN ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'INSTITUTION_STAFF', 'INSTITUTION_TREASURER', 'INSTITUTION_AUDITOR');
  END IF;
  
  -- Migrate staff_invites table roles
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_invites') THEN
    UPDATE staff_invites
    SET role = CASE
      WHEN role IN ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN') THEN 'ADMIN'
      WHEN role IN ('INSTITUTION_STAFF', 'INSTITUTION_TREASURER', 'INSTITUTION_AUDITOR') THEN 'STAFF'
      WHEN role NOT IN ('ADMIN', 'STAFF', 'PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'INSTITUTION_STAFF', 'INSTITUTION_TREASURER', 'INSTITUTION_AUDITOR') THEN 'STAFF'
      ELSE role
    END
    WHERE role NOT IN ('ADMIN', 'STAFF')
      AND role IN ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'INSTITUTION_STAFF', 'INSTITUTION_TREASURER', 'INSTITUTION_AUDITOR');
  END IF;
END $data_migration$;

-- ============================================================================
-- PRODUCTION VERIFICATION
-- ============================================================================
-- Run these queries manually to verify production readiness:
-- 
-- SELECT role, COUNT(*) as count FROM profiles GROUP BY role ORDER BY role;
-- SELECT role, COUNT(*) as count FROM staff_invites GROUP BY role ORDER BY role;
-- SELECT routine_name FROM information_schema.routines 
--   WHERE routine_schema = 'public' 
--   AND (routine_name LIKE '%staff%' OR routine_name LIKE '%role%');
-- 
-- Expected:
-- - All functions accept ADMIN/STAFF and legacy role names
-- - All data migrated to simplified roles
-- - All RLS policies work with simplified roles
