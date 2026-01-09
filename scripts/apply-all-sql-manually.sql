-- ============================================================================
-- Combined SQL Script: Apply All New Migrations
-- Run this in Supabase SQL Editor to apply:
-- 1. Manual cron trigger functions
-- 2. Configure groups (mark daily, ensure leaders, seed templates)
-- ============================================================================

-- ============================================================================
-- PART 1: Manual Cron Trigger Functions
-- ============================================================================

-- Function to manually trigger weekly reminders
CREATE OR REPLACE FUNCTION public.trigger_weekly_reminders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'message', 'Call Edge Function: POST /functions/v1/send-scheduled-notifications',
    'body', jsonb_build_object('type', 'CONTRIBUTION_REMINDER'),
    'url', 'https://wadhydemushqqtcrrlwm.supabase.co/functions/v1/send-scheduled-notifications'
  );
END;
$$;

-- Function to manually trigger weekly reports
CREATE OR REPLACE FUNCTION public.trigger_weekly_reports()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'message', 'Call Edge Function: POST /functions/v1/send-scheduled-notifications',
    'body', jsonb_build_object(
      'type', 'GROUP_REPORT',
      'reportType', 'WEEKLY'
    ),
    'url', 'https://wadhydemushqqtcrrlwm.supabase.co/functions/v1/send-scheduled-notifications'
  );
END;
$$;

-- Function to manually trigger monthly reports
CREATE OR REPLACE FUNCTION public.trigger_monthly_reports()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'message', 'Call Edge Function: POST /functions/v1/send-scheduled-notifications',
    'body', jsonb_build_object(
      'type', 'GROUP_REPORT',
      'reportType', 'MONTHLY'
    ),
    'url', 'https://wadhydemushqqtcrrlwm.supabase.co/functions/v1/send-scheduled-notifications'
  );
END;
$$;

-- Function to manually trigger periodic totals
CREATE OR REPLACE FUNCTION public.trigger_periodic_totals()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'message', 'Call Edge Function: POST /functions/v1/send-scheduled-notifications',
    'body', jsonb_build_object('type', 'PERIODIC_REPORT'),
    'url', 'https://wadhydemushqqtcrrlwm.supabase.co/functions/v1/send-scheduled-notifications'
  );
END;
$$;

COMMENT ON FUNCTION public.trigger_weekly_reminders IS 
'Manual trigger for weekly contribution reminders. Returns instructions to call Edge Function.';

COMMENT ON FUNCTION public.trigger_weekly_reports IS 
'Manual trigger for weekly group reports. Returns instructions to call Edge Function.';

COMMENT ON FUNCTION public.trigger_monthly_reports IS 
'Manual trigger for monthly group reports. Returns instructions to call Edge Function.';

COMMENT ON FUNCTION public.trigger_periodic_totals IS 
'Manual trigger for periodic totals. Returns instructions to call Edge Function.';

-- ============================================================================
-- PART 2: Configure Groups
-- ============================================================================

-- Step 1: Mark daily contribution groups (like "buri munsi")
UPDATE public.groups
SET daily_contribution = true
WHERE 
  group_name ILIKE '%buri munsi%'
  OR group_name ILIKE '%daily%'
  OR group_name ILIKE '%everyday%';

-- Step 2: Ensure all groups have at least one leader
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

-- ============================================================================
-- Verification Queries
-- ============================================================================

SELECT 
  'Groups with daily contribution' as check_type,
  COUNT(*) as count
FROM public.groups
WHERE daily_contribution = true
UNION ALL
SELECT 
  'Groups without leaders' as check_type,
  COUNT(*) as count
FROM public.groups g
WHERE status = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.group_members gm
    WHERE gm.group_id = g.id
      AND gm.role IN ('LEADER', 'CHAIRPERSON')
      AND gm.status = 'GOOD_STANDING'
  )
UNION ALL
SELECT 
  'Institutions with notification templates' as check_type,
  COUNT(DISTINCT institution_id) as count
FROM public.notification_templates
WHERE is_active = true
UNION ALL
SELECT 
  'Cron trigger functions' as check_type,
  COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE 'trigger_%';
