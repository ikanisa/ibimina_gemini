-- ============================================================================
-- Migration: Ensure group_members Table Exists
-- Purpose: Create group_members table if it doesn't exist (required for group leaders)
-- ============================================================================

-- Check what enum values exist and use appropriate default
DO $$
DECLARE
  v_has_good_standing boolean;
  v_default_status text;
BEGIN
  -- Check if 'GOOD_STANDING' exists in enum
  SELECT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'GOOD_STANDING' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'group_member_status')
  ) INTO v_has_good_standing;
  
  IF v_has_good_standing THEN
    v_default_status := 'GOOD_STANDING';
  ELSE
    -- Use first available enum value
    SELECT enumlabel INTO v_default_status
    FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'group_member_status')
    ORDER BY enumsortorder
    LIMIT 1;
  END IF;
  
  -- Create group_members table with dynamic default
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS public.group_members (
      id uuid primary key default gen_random_uuid(),
      institution_id uuid not null references public.institutions(id) on delete cascade,
      group_id uuid not null references public.groups(id) on delete cascade,
      member_id uuid not null references public.members(id) on delete cascade,
      role group_member_role not null default ''MEMBER'',
      status group_member_status not null default %L,
      joined_date date,
      created_at timestamptz not null default now(),
      unique(group_id, member_id)
    )', v_default_status);
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_group_members_institution_id 
  ON public.group_members (institution_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id 
  ON public.group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_member_id 
  ON public.group_members (member_id);

-- Enable RLS if not already enabled
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'group_members' 
    AND policyname = 'group_members_access'
  ) THEN
    CREATE POLICY "group_members_access"
    ON public.group_members
    FOR ALL
    USING (
      public.is_platform_admin() 
      OR institution_id = public.current_institution_id()
    )
    WITH CHECK (
      public.is_platform_admin() 
      OR institution_id = public.current_institution_id()
    );
  END IF;
END $$;

COMMENT ON TABLE public.group_members IS 'Junction table for group membership and roles (required for group leaders feature)';
