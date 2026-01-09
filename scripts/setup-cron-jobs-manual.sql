-- ============================================================================
-- Manual Cron Jobs Setup for Supabase
-- Note: Supabase uses pg_cron extension, but requires specific setup
-- ============================================================================
-- 
-- IMPORTANT: Supabase may not support pg_cron directly.
-- Alternative: Use Supabase Edge Functions with external cron service
-- (e.g., GitHub Actions, Cloudflare Workers Cron, or external cron service)
--
-- ============================================================================
-- Option 1: If pg_cron is available (check with Supabase support)
-- ============================================================================

-- Enable pg_cron extension
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Note: The following requires net.http extension for HTTP calls
-- CREATE EXTENSION IF NOT EXISTS net;

-- Weekly Contribution Reminders (Every Monday at 9:00 AM)
/*
SELECT cron.schedule(
  'weekly-contribution-reminders',
  '0 9 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://wadhydemushqqtcrrlwm.supabase.co/functions/v1/send-scheduled-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body := jsonb_build_object('type', 'CONTRIBUTION_REMINDER')
  );
  $$
);
*/

-- ============================================================================
-- Option 2: Manual Trigger Functions (Recommended for Supabase)
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
-- Option 3: External Cron Service Setup Instructions
-- ============================================================================
-- 
-- For automated scheduling, use one of these external services:
--
-- 1. GitHub Actions (Scheduled Workflows)
--    - Create .github/workflows/scheduled-notifications.yml
--    - Use cron syntax: '0 9 * * 1' (Every Monday at 9 AM)
--    - Call Edge Function via HTTP POST
--
-- 2. Cloudflare Workers Cron Triggers
--    - Create a Worker with cron trigger
--    - Call Supabase Edge Function
--
-- 3. External Cron Service (cron-job.org, EasyCron, etc.)
--    - Set up HTTP POST requests to Edge Functions
--    - Schedule: Weekly, Monthly, etc.
--
-- ============================================================================
