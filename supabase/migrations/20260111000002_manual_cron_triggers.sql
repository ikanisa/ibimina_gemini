-- ============================================================================
-- Migration: Manual Cron Trigger Functions
-- Purpose: Create functions to manually trigger scheduled notifications
-- Note: Supabase may not support pg_cron directly, so we provide manual triggers
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
