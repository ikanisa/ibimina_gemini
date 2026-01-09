-- ============================================================================
-- Migration: Configure Groups
-- Purpose: Mark daily contribution groups, ensure leaders, seed templates
-- ============================================================================

-- Step 1: Mark daily contribution groups (like "buri munsi")
-- Update the WHERE clause to match your daily contribution groups
UPDATE public.groups
SET daily_contribution = true
WHERE 
  group_name ILIKE '%buri munsi%'
  OR group_name ILIKE '%daily%'
  OR group_name ILIKE '%everyday%';

-- Step 2: Ensure all groups have at least one leader
-- This will assign the first member as LEADER if no leader exists
DO $$
DECLARE
  group_record RECORD;
  first_member_id UUID;
BEGIN
  FOR group_record IN 
    SELECT id, institution_id 
    FROM public.groups 
    WHERE status = 'ACTIVE'
  LOOP
    -- Check if group has any leaders
    IF NOT EXISTS (
      SELECT 1 
      FROM public.group_members 
      WHERE group_id = group_record.id 
        AND role IN ('LEADER', 'CHAIRPERSON')
        AND status = 'GOOD_STANDING'
    ) THEN
      -- Get first member in the group
      SELECT member_id INTO first_member_id
      FROM public.group_members
      WHERE group_id = group_record.id
        AND status = 'GOOD_STANDING'
      ORDER BY created_at ASC
      LIMIT 1;
      
      -- Assign as LEADER if member exists
      IF first_member_id IS NOT NULL THEN
        UPDATE public.group_members
        SET role = 'LEADER'
        WHERE group_id = group_record.id
          AND member_id = first_member_id;
        
        RAISE NOTICE 'Assigned LEADER role to first member in group %', group_record.id;
      ELSE
        RAISE WARNING 'Group % has no members to assign as leader', group_record.id;
      END IF;
    END IF;
  END LOOP;
END $$;

-- Step 3: Seed notification templates for all institutions
DO $$
DECLARE
  inst_record RECORD;
BEGIN
  FOR inst_record IN 
    SELECT id FROM public.institutions WHERE status = 'ACTIVE'
  LOOP
    PERFORM public.seed_notification_templates(inst_record.id);
    RAISE NOTICE 'Seeded notification templates for institution %', inst_record.id;
  END LOOP;
END $$;

-- Verification queries (only if group_members table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_members') THEN
    RAISE NOTICE 'Verification Results:';
    RAISE NOTICE 'Groups with daily contribution: %', (SELECT COUNT(*) FROM public.groups WHERE daily_contribution = true);
    RAISE NOTICE 'Groups without leaders: %', (
      SELECT COUNT(*) 
      FROM public.groups g
      WHERE status = 'ACTIVE'
        AND NOT EXISTS (
          SELECT 1 
          FROM public.group_members gm
          WHERE gm.group_id = g.id
            AND gm.role IN ('LEADER', 'CHAIRPERSON')
            AND gm.status = 'GOOD_STANDING'
        )
    );
    RAISE NOTICE 'Institutions with notification templates: %', (
      SELECT COUNT(DISTINCT institution_id) 
      FROM public.notification_templates
      WHERE is_active = true
    );
  ELSE
    RAISE WARNING 'group_members table does not exist - skipping leader verification';
    RAISE NOTICE 'Groups with daily contribution: %', (SELECT COUNT(*) FROM public.groups WHERE daily_contribution = true);
    RAISE NOTICE 'Institutions with notification templates: %', (
      SELECT COUNT(DISTINCT institution_id) 
      FROM public.notification_templates
      WHERE is_active = true
    );
  END IF;
END $$;
