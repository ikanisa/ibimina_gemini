-- ============================================================================
-- Cron Jobs Setup for Automated Notifications
-- Requires pg_cron extension to be enabled
-- ============================================================================

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- Weekly Contribution Reminders
-- Runs every Monday at 9:00 AM
-- ============================================================================

SELECT cron.schedule(
  'weekly-contribution-reminders',
  '0 9 * * 1', -- Every Monday at 9 AM
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url', true) || '/functions/v1/send-scheduled-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true),
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body := jsonb_build_object('type', 'CONTRIBUTION_REMINDER')
  );
  $$
);

-- ============================================================================
-- Weekly Reports for Daily Contribution Groups
-- Runs every Monday at 10:00 AM
-- ============================================================================

SELECT cron.schedule(
  'weekly-group-reports-daily',
  '0 10 * * 1', -- Every Monday at 10 AM
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url', true) || '/functions/v1/send-scheduled-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true),
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body := jsonb_build_object(
      'type', 'GROUP_REPORT',
      'reportType', 'WEEKLY'
    )
  );
  $$
);

-- ============================================================================
-- Monthly Reports
-- Runs on the first day of each month at 9:00 AM
-- ============================================================================

SELECT cron.schedule(
  'monthly-group-reports',
  '0 9 1 * *', -- First day of month at 9 AM
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url', true) || '/functions/v1/send-scheduled-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true),
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body := jsonb_build_object(
      'type', 'GROUP_REPORT',
      'reportType', 'MONTHLY'
    )
  );
  $$
);

-- ============================================================================
-- Periodic Totals to Members
-- Runs every Monday at 11:00 AM
-- ============================================================================

SELECT cron.schedule(
  'weekly-periodic-totals',
  '0 11 * * 1', -- Every Monday at 11 AM
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url', true) || '/functions/v1/send-scheduled-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true),
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body := jsonb_build_object('type', 'PERIODIC_REPORT')
  );
  $$
);

-- ============================================================================
-- Process Pending Notifications
-- Runs every minute to send queued notifications
-- ============================================================================

SELECT cron.schedule(
  'process-pending-notifications',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url', true) || '/functions/v1/process-pending-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true),
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================================
-- View Scheduled Jobs
-- ============================================================================

-- To view all scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule a job:
-- SELECT cron.unschedule('job-name');

-- ============================================================================
-- Alternative: Manual Trigger Functions
-- Use these if pg_cron is not available
-- ============================================================================

-- Function to manually trigger weekly reminders
CREATE OR REPLACE FUNCTION public.trigger_weekly_reminders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This would call the Edge Function
  -- For now, returns instructions
  RETURN jsonb_build_object(
    'message', 'Call Edge Function manually: POST /functions/v1/send-scheduled-notifications',
    'body', jsonb_build_object('type', 'CONTRIBUTION_REMINDER')
  );
END;
$$;

COMMENT ON FUNCTION public.trigger_weekly_reminders IS 
'Manual trigger for weekly contribution reminders. 
Call the Edge Function directly if pg_cron is not available.';
