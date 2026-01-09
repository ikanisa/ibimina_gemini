-- ============================================================================
-- Migration: Contribution Confirmation Notifications
-- Purpose: Send confirmation notifications after contribution allocation
-- ============================================================================

-- ============================================================================
-- STEP 1: Add contribution confirmation template to seed function
-- ============================================================================

create or replace function public.seed_notification_templates(p_institution_id uuid)
returns void
language plpgsql
as $$
begin
  -- Contribution reminder template
  insert into public.notification_templates (
    institution_id, template_type, channel, language, subject, body, variables
  ) values (
    p_institution_id,
    'CONTRIBUTION_REMINDER',
    'BOTH',
    'en',
    'Contribution Reminder',
    'Hello {{member_name}}, this is a reminder that your contribution of {{expected_amount}} {{currency}} is due for {{group_name}}. Please make your contribution by {{due_date}}. Thank you!',
    '{"member_name": "Member full name", "expected_amount": "Expected contribution amount", "currency": "Currency code", "group_name": "Group name", "due_date": "Due date"}'
  )
  on conflict do nothing;

  -- Periodic total template (for members)
  insert into public.notification_templates (
    institution_id, template_type, channel, language, subject, body, variables
  ) values (
    p_institution_id,
    'PERIODIC_TOTAL',
    'BOTH',
    'en',
    'Your Contribution Summary',
    'Hello {{member_name}}, your contribution summary for {{period}}: Period Total: {{period_total}} {{currency}}, Overall Total: {{overall_total}} {{currency}}. Group: {{group_name}}',
    '{"member_name": "Member full name", "period": "Period label (e.g., Week 1, January)", "period_total": "Total for the period", "overall_total": "Overall total", "currency": "Currency code", "group_name": "Group name"}'
  )
  on conflict do nothing;

  -- Group report notification (for leaders)
  insert into public.notification_templates (
    institution_id, template_type, channel, language, subject, body, variables
  ) values (
    p_institution_id,
    'GROUP_REPORT',
    'WHATSAPP',
    'en',
    'Group Contribution Report',
    'Hello {{leader_name}}, the {{report_type}} contribution report for {{group_name}} is ready. Period: {{period_start}} to {{period_end}}. Total Contributions: {{total_contributions}} {{currency}}. Member Count: {{member_count}}. The detailed PDF report has been sent to you.',
    '{"leader_name": "Leader name", "report_type": "WEEKLY, MONTHLY, or OVERALL", "group_name": "Group name", "period_start": "Period start date", "period_end": "Period end date", "total_contributions": "Total contributions", "currency": "Currency code", "member_count": "Number of members"}'
  )
  on conflict do nothing;

  -- Contribution confirmation template (NEW)
  insert into public.notification_templates (
    institution_id, template_type, channel, language, subject, body, variables
  ) values (
    p_institution_id,
    'CONTRIBUTION_CONFIRMATION',
    'BOTH',
    'en',
    'Contribution Received',
    'Hello {{member_name}}, your contribution of {{contribution_amount}} {{currency}} has been received and allocated to {{group_name}}. Your total contribution is now {{overall_total}} {{currency}}.{{arrears_message}} Thank you!',
    '{"member_name": "Member full name", "contribution_amount": "Amount just contributed", "currency": "Currency code", "group_name": "Group name", "overall_total": "Total overall contribution", "arrears_message": "Message about any arrears (optional)"}'
  )
  on conflict do nothing;
end;
$$;

-- ============================================================================
-- STEP 2: Create function to calculate member arrears
-- ============================================================================

create or replace function public.calculate_member_arrears(
  p_member_id uuid,
  p_group_id uuid,
  p_current_date date default current_date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group record;
  v_expected_amount numeric;
  v_frequency text;
  v_period_start date;
  v_period_end date;
  v_period_contributions numeric;
  v_expected_periods integer;
  v_actual_periods integer;
  v_arrears numeric;
  v_arrears_message text;
begin
  -- Get group details
  select 
    expected_amount,
    frequency,
    daily_contribution
  into v_group
  from public.groups
  where id = p_group_id;

  if not found then
    return jsonb_build_object(
      'arrears', 0,
      'arrears_message', '',
      'error', 'Group not found'
    );
  end if;

  v_expected_amount := v_group.expected_amount;
  v_frequency := v_group.frequency;

  -- Calculate period based on frequency
  if v_group.daily_contribution then
    -- For daily contributions, calculate weekly arrears
    v_period_start := date_trunc('week', p_current_date)::date;
    v_period_end := v_period_start + interval '6 days';
    v_expected_periods := 7; -- 7 days per week
  elsif v_frequency = 'Weekly' then
    v_period_start := date_trunc('week', p_current_date)::date;
    v_period_end := v_period_start + interval '6 days';
    v_expected_periods := 1; -- 1 contribution per week
  else -- Monthly
    v_period_start := date_trunc('month', p_current_date)::date;
    v_period_end := (date_trunc('month', p_current_date) + interval '1 month - 1 day')::date;
    v_expected_periods := 1; -- 1 contribution per month
  end if;

  -- Get contributions for current period
  select coalesce(sum(amount), 0)
  into v_period_contributions
  from public.transactions
  where member_id = p_member_id
    and group_id = p_group_id
    and type = 'CONTRIBUTION'
    and status = 'COMPLETED'
    and occurred_at::date >= v_period_start
    and occurred_at::date <= v_period_end;

  -- Calculate how many periods the member should have contributed
  -- For simplicity, we'll check if they've met the expected amount for the period
  if v_group.daily_contribution then
    -- For daily, check if they've contributed the daily amount * 7
    v_expected_periods := 7;
    v_arrears := (v_expected_amount * v_expected_periods) - v_period_contributions;
  else
    -- For weekly/monthly, check if they've contributed the expected amount
    v_arrears := v_expected_amount - v_period_contributions;
  end if;

  -- Build arrears message
  if v_arrears > 0 then
    v_arrears_message := format(
      ' You have outstanding arrears of %s %s for the current period (%s to %s).',
      v_arrears,
      (select currency from public.groups where id = p_group_id),
      v_period_start,
      v_period_end
    );
  else
    v_arrears_message := '';
  end if;

  return jsonb_build_object(
    'arrears', greatest(v_arrears, 0),
    'arrears_message', v_arrears_message,
    'period_start', v_period_start,
    'period_end', v_period_end,
    'period_contributions', v_period_contributions,
    'expected_amount', v_expected_amount
  );
end;
$$;

-- ============================================================================
-- STEP 3: Create function to send contribution confirmation
-- ============================================================================

create or replace function public.send_contribution_confirmation(
  p_transaction_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction record;
  v_member record;
  v_group record;
  v_overall_total numeric;
  v_arrears_data jsonb;
  v_template record;
  v_message_body text;
  v_variables jsonb;
  v_notification_id uuid;
begin
  -- Get transaction details
  select * into v_transaction
  from public.transactions
  where id = p_transaction_id
    and type = 'CONTRIBUTION'
    and allocation_status = 'allocated';

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Transaction not found or not allocated'
    );
  end if;

  -- Get member details
  select * into v_member
  from public.members
  where id = v_transaction.member_id;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Member not found'
    );
  end if;

  -- Get group details
  select * into v_group
  from public.groups
  where id = v_transaction.group_id;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Group not found'
    );
  end if;

  -- Get overall total contribution
  select coalesce(sum(amount), 0)
  into v_overall_total
  from public.transactions
  where member_id = v_member.id
    and group_id = v_group.id
    and type = 'CONTRIBUTION'
    and status = 'COMPLETED';

  -- Calculate arrears
  v_arrears_data := public.calculate_member_arrears(
    v_member.id,
    v_group.id,
    v_transaction.occurred_at::date
  );

  -- Get notification template
  select * into v_template
  from public.notification_templates
  where institution_id = v_transaction.institution_id
    and template_type = 'CONTRIBUTION_CONFIRMATION'
    and channel in ('BOTH', 'WHATSAPP', 'SMS')
    and is_active = true
    and language = 'en'
  limit 1;

  if not found then
    -- Use default template if none found
    v_message_body := format(
      'Hello %s, your contribution of %s %s has been received and allocated to %s. Your total contribution is now %s %s.%s Thank you!',
      v_member.full_name,
      v_transaction.amount,
      v_group.currency,
      v_group.group_name,
      v_overall_total,
      v_group.currency,
      v_arrears_data->>'arrears_message'
    );
  else
    -- Replace template variables
    v_message_body := v_template.body;
    v_message_body := replace(v_message_body, '{{member_name}}', coalesce(v_member.full_name, 'Member'));
    v_message_body := replace(v_message_body, '{{contribution_amount}}', v_transaction.amount::text);
    v_message_body := replace(v_message_body, '{{currency}}', v_group.currency);
    v_message_body := replace(v_message_body, '{{group_name}}', v_group.group_name);
    v_message_body := replace(v_message_body, '{{overall_total}}', v_overall_total::text);
    v_message_body := replace(v_message_body, '{{arrears_message}}', coalesce(v_arrears_data->>'arrears_message', ''));
  end if;

  -- Log notification for WhatsApp
  insert into public.notification_logs (
    institution_id,
    recipient_type,
    recipient_id,
    recipient_phone,
    channel,
    template_type,
    message_body,
    status,
    metadata
  ) values (
    v_transaction.institution_id,
    'MEMBER',
    v_member.id,
    v_member.phone,
    'WHATSAPP',
    'CONTRIBUTION_CONFIRMATION',
    v_message_body,
    'PENDING',
    jsonb_build_object(
      'transaction_id', p_transaction_id,
      'contribution_amount', v_transaction.amount,
      'overall_total', v_overall_total,
      'arrears', v_arrears_data->>'arrears'
    )
  )
  returning id into v_notification_id;

  -- Log notification for SMS
  insert into public.notification_logs (
    institution_id,
    recipient_type,
    recipient_id,
    recipient_phone,
    channel,
    template_type,
    message_body,
    status,
    metadata
  ) values (
    v_transaction.institution_id,
    'MEMBER',
    v_member.id,
    v_member.phone,
    'SMS',
    'CONTRIBUTION_CONFIRMATION',
    v_message_body,
    'PENDING',
    jsonb_build_object(
      'transaction_id', p_transaction_id,
      'contribution_amount', v_transaction.amount,
      'overall_total', v_overall_total,
      'arrears', v_arrears_data->>'arrears'
    )
  );

  -- Trigger Edge Function to actually send notifications
  -- This will be handled by a database trigger that calls an Edge Function
  -- For now, we just log the notifications and they'll be sent by a background job

  return jsonb_build_object(
    'success', true,
    'notification_id', v_notification_id,
    'message', 'Contribution confirmation logged',
    'overall_total', v_overall_total,
    'arrears', v_arrears_data->>'arrears'
  );
end;
$$;

-- ============================================================================
-- STEP 4: Create trigger to send confirmation after allocation
-- ============================================================================

create or replace function public.trigger_contribution_confirmation()
returns trigger
language plpgsql
as $$
begin
  -- Only trigger for CONTRIBUTION transactions that are being allocated
  if new.type = 'CONTRIBUTION' 
     and new.allocation_status = 'allocated' 
     and (old.allocation_status is null or old.allocation_status != 'allocated')
     and new.member_id is not null
     and new.group_id is not null then
    
    -- Call the confirmation function directly
    -- This will log the notifications, and they'll be sent by a background job
    -- or the Edge Function can be called separately
    perform public.send_contribution_confirmation(new.id);
  end if;

  return new;
end;
$$;

-- Create trigger
drop trigger if exists contribution_confirmation_trigger on public.transactions;
create trigger contribution_confirmation_trigger
after insert or update on public.transactions
for each row
when (new.type = 'CONTRIBUTION' and new.allocation_status = 'allocated')
execute function public.trigger_contribution_confirmation();

-- ============================================================================
-- STEP 5: Alternative approach - Direct function call (if pg_net not available)
-- ============================================================================

-- If pg_net is not available, we can use a simpler approach:
-- Just call the function directly and let Edge Functions poll for pending notifications

comment on function public.send_contribution_confirmation is 
'Calculates contribution totals and arrears, then logs notifications. 
Actual sending is handled by Edge Function that polls notification_logs table.';
