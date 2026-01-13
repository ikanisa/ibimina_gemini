-- ============================================================================
-- Migration: Update RLS Functions for Simplified Roles
-- Date: 2026-01-15
-- Purpose: Update database helper functions to work with simplified 'ADMIN' and 'STAFF' roles
-- Note: We create public versions since we cannot modify auth schema functions
-- ============================================================================

-- Create/update public.is_staff() function to check for new simplified roles
-- This works alongside or replaces auth.is_staff() depending on RLS policy usage
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.is_staff()
    RETURNS BOOLEAN AS $func$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND role IN (''ADMIN'', ''STAFF'', ''PLATFORM_ADMIN'', ''INSTITUTION_ADMIN'', ''INSTITUTION_STAFF'', ''INSTITUTION_TREASURER'', ''INSTITUTION_AUDITOR'')
        AND status = ''ACTIVE''
      );
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;
    ';
    
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;';
  END IF;
END $$;

-- Create/update public.is_admin() function to check for new simplified roles
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.is_admin()
    RETURNS BOOLEAN AS $func$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND role IN (''ADMIN'', ''PLATFORM_ADMIN'', ''INSTITUTION_ADMIN'')
        AND status = ''ACTIVE''
      );
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;
    ';
    
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;';
  END IF;
END $$;

-- Update update_staff_role function to accept new simplified roles
-- This function MUST be updated for production deployment
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'update_staff_role') THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.update_staff_role(
      p_user_id uuid,
      p_role text
    )
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $func$
    DECLARE
      v_target_profile public.profiles;
      v_actor_role text;
      v_actor_institution_id uuid;
    BEGIN
      -- Get actor info
      SELECT role, institution_id INTO v_actor_role, v_actor_institution_id
      FROM public.profiles WHERE user_id = auth.uid();

      -- Get target profile
      SELECT * INTO v_target_profile FROM public.profiles WHERE user_id = p_user_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION ''Staff member not found'';
      END IF;

      -- Validate role - accept both new simplified roles and legacy roles for backward compatibility
      IF p_role NOT IN (''ADMIN'', ''STAFF'', ''PLATFORM_ADMIN'', ''INSTITUTION_ADMIN'', ''INSTITUTION_STAFF'', ''INSTITUTION_TREASURER'', ''INSTITUTION_AUDITOR'') THEN
        RAISE EXCEPTION ''Invalid role'';
      END IF;

      -- Permission checks - updated for simplified roles
      IF v_actor_role IN (''ADMIN'', ''PLATFORM_ADMIN'') THEN
        -- Admin can update any role
        NULL;
      ELSIF v_actor_role = ''INSTITUTION_ADMIN'' THEN
        -- Institution admin can only update staff in their institution
        IF v_target_profile.institution_id != v_actor_institution_id THEN
          RAISE EXCEPTION ''Cannot update staff from another institution'';
        END IF;
        -- Cannot promote to platform admin
        IF p_role = ''PLATFORM_ADMIN'' THEN
          RAISE EXCEPTION ''Cannot promote to platform admin'';
        END IF;
        -- Cannot demote another institution admin
        IF v_target_profile.role = ''INSTITUTION_ADMIN'' AND p_user_id != auth.uid() THEN
          RAISE EXCEPTION ''Cannot demote another institution admin'';
        END IF;
      ELSE
        RAISE EXCEPTION ''Permission denied'';
      END IF;

      -- Update role (remove ::user_role cast if it exists, use text directly) - ACTUALLY WE NEED CAST
      UPDATE public.profiles
      SET role = p_role::user_role, updated_at = now()
      WHERE user_id = p_user_id;

      -- Audit log
      IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = ''public'' AND table_name = ''audit_log'') THEN
        INSERT INTO public.audit_log (
          actor_user_id, institution_id, action, entity_type, entity_id, metadata
        ) VALUES (
          auth.uid(),
          v_target_profile.institution_id,
          ''update_staff_role'',
          ''profile'',
          p_user_id,
          jsonb_build_object(
            ''old_role'', v_target_profile.role,
            ''new_role'', p_role,
            ''staff_email'', v_target_profile.email
          )
        );
      END IF;
    END;
    $func$;
    ';
    
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.update_staff_role(uuid, text) TO authenticated;';
    EXECUTE 'COMMENT ON FUNCTION public.update_staff_role(uuid, text) IS ''Updates a staff member''''s role - supports simplified ADMIN/STAFF roles'';';
  END IF;
END $$;

-- Update deactivate_staff function to work with simplified roles
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'deactivate_staff') THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.deactivate_staff(
      p_user_id uuid,
      p_reason text DEFAULT NULL
    )
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $func$
    DECLARE
      v_target_profile public.profiles;
      v_actor_role text;
      v_actor_institution_id uuid;
    BEGIN
      -- Get actor info
      SELECT role, institution_id INTO v_actor_role, v_actor_institution_id
      FROM public.profiles WHERE user_id = auth.uid();

      -- Get target profile
      SELECT * INTO v_target_profile FROM public.profiles WHERE user_id = p_user_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION ''Staff member not found'';
      END IF;

      -- Cannot deactivate yourself
      IF p_user_id = auth.uid() THEN
        RAISE EXCEPTION ''Cannot deactivate your own account'';
      END IF;

      -- Permission checks - updated for simplified roles
      IF v_actor_role IN (''ADMIN'', ''PLATFORM_ADMIN'') THEN
        NULL; -- Can deactivate anyone
      ELSIF v_actor_role = ''INSTITUTION_ADMIN'' THEN
        IF v_target_profile.institution_id != v_actor_institution_id THEN
          RAISE EXCEPTION ''Cannot deactivate staff from another institution'';
        END IF;
        IF v_target_profile.role IN (''ADMIN'', ''PLATFORM_ADMIN'') THEN
          RAISE EXCEPTION ''Cannot deactivate an admin'';
        END IF;
      ELSE
        RAISE EXCEPTION ''Permission denied'';
      END IF;

      -- Deactivate
      UPDATE public.profiles
      SET 
        is_active = false,
        status = ''SUSPENDED'',
        updated_at = now()
      WHERE user_id = p_user_id;

      -- Audit log
      IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = ''public'' AND table_name = ''audit_log'') THEN
        INSERT INTO public.audit_log (
          actor_user_id, institution_id, action, entity_type, entity_id, metadata
        ) VALUES (
          auth.uid(),
          v_target_profile.institution_id,
          ''deactivate_staff'',
          ''profile'',
          p_user_id,
          jsonb_build_object(
            ''reason'', p_reason,
            ''staff_email'', v_target_profile.email,
            ''staff_role'', v_target_profile.role
          )
        );
      END IF;
    END;
    $func$;
    ';
    
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.deactivate_staff(uuid, text) TO authenticated;';
  END IF;
END $$;

-- Update update_institution function to work with simplified roles
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'update_institution') THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.update_institution(
      p_institution_id uuid,
      p_name text DEFAULT NULL,
      p_status text DEFAULT NULL,
      p_code text DEFAULT NULL,
      p_supervisor text DEFAULT NULL,
      p_contact_email text DEFAULT NULL,
      p_contact_phone text DEFAULT NULL,
      p_region text DEFAULT NULL
    )
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $func$
    DECLARE
      v_institution public.institutions;
      v_old_data jsonb;
      v_actor_role text;
    BEGIN
      -- Get actor role
      SELECT role INTO v_actor_role FROM public.profiles WHERE user_id = auth.uid();
      
      -- Permission check - updated for simplified roles
      IF v_actor_role NOT IN (''ADMIN'', ''PLATFORM_ADMIN'', ''INSTITUTION_ADMIN'') THEN
        RAISE EXCEPTION ''Permission denied'';
      END IF;

      -- Get current institution data
      SELECT * INTO v_institution FROM public.institutions WHERE id = p_institution_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION ''Institution not found'';
      END IF;

      -- Store old data for audit
      v_old_data := row_to_json(v_institution)::jsonb;

      -- Update institution
      UPDATE public.institutions
      SET
        name = COALESCE(p_name, name),
        status = COALESCE(p_status, status),
        code = COALESCE(p_code, code),
        supervisor = COALESCE(p_supervisor, supervisor),
        contact_email = COALESCE(p_contact_email, contact_email),
        contact_phone = COALESCE(p_contact_phone, contact_phone),
        region = COALESCE(p_region, region),
        updated_at = now()
      WHERE id = p_institution_id;

      -- Audit log
      IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = ''public'' AND table_name = ''audit_log'') THEN
        INSERT INTO public.audit_log (
          actor_user_id, institution_id, action, entity_type, entity_id, metadata
        ) VALUES (
          auth.uid(),
          p_institution_id,
          ''update_institution'',
          ''institution'',
          p_institution_id,
          jsonb_build_object(
            ''old'', v_old_data,
            ''changes'', jsonb_build_object(
              ''name'', p_name,
              ''status'', p_status,
              ''code'', p_code
            )
          )
        );
      END IF;

      -- If suspending institution, deactivate all staff (except admins)
      IF p_status = ''SUSPENDED'' AND v_institution.status != ''SUSPENDED'' THEN
        UPDATE public.profiles
        SET is_active = false
        WHERE institution_id = p_institution_id 
          AND role NOT IN (''ADMIN'', ''PLATFORM_ADMIN'');

        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = ''public'' AND table_name = ''audit_log'') THEN
          INSERT INTO public.audit_log (
            actor_user_id, institution_id, action, entity_type, entity_id, metadata
          ) VALUES (
            auth.uid(),
            p_institution_id,
            ''suspend_institution_staff'',
            ''institution'',
            p_institution_id,
            jsonb_build_object(''reason'', ''Institution suspended'')
          );
        END IF;
      END IF;
    END;
    $func$;
    ';
    
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.update_institution(uuid, text, text, text, text, text, text, text) TO authenticated;';
  END IF;
END $$;
