-- ============================================================================
-- Migration: Group Leaders & WhatsApp Integration
-- Purpose: Add LEADER role, ensure groups have leaders, add WhatsApp support
-- ============================================================================

-- ============================================================================
-- STEP 1: Add LEADER to group_member_role enum
-- ============================================================================

-- Add LEADER to the enum if it doesn't exist
do $$
begin
  if not exists (
    select 1 from pg_enum 
    where enumlabel = 'LEADER' 
    and enumtypid = (select oid from pg_type where typname = 'group_member_role')
  ) then
    alter type group_member_role add value 'LEADER';
  end if;
end $$;

-- ============================================================================
-- STEP 2: Add constraint to ensure groups have at least one leader
-- ============================================================================

-- Create function to check if group has at least one leader
create or replace function public.check_group_has_leader()
returns trigger
language plpgsql
as $$
declare
  v_leader_count integer;
begin
  -- Count leaders in the group
  select count(*) into v_leader_count
  from public.group_members
  where group_id = coalesce(new.group_id, old.group_id)
    and role in ('LEADER', 'CHAIRPERSON')
    and status = 'GOOD_STANDING';
  
  -- If this is a delete operation and it would leave no leaders, prevent it
  if tg_op = 'DELETE' then
    if old.role in ('LEADER', 'CHAIRPERSON') and v_leader_count <= 1 then
      raise exception 'Cannot remove the last leader from a group. A group must have at least one leader.';
    end if;
  end if;
  
  return coalesce(new, old);
end;
$$;

-- Create trigger to enforce leader requirement
drop trigger if exists enforce_group_leader on public.group_members;
create trigger enforce_group_leader
after insert or update or delete on public.group_members
for each row execute function public.check_group_has_leader();

-- ============================================================================
-- STEP 3: Create notification_templates table
-- ============================================================================

create table if not exists public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  template_type text not null, -- 'CONTRIBUTION_REMINDER', 'PERIODIC_TOTAL', 'GROUP_REPORT', etc.
  channel text not null check (channel in ('SMS', 'WHATSAPP', 'BOTH')),
  language text not null default 'en',
  subject text, -- For email/WhatsApp
  body text not null, -- Template body with placeholders like {{member_name}}, {{amount}}, etc.
  variables jsonb default '{}'::jsonb, -- Available variables for this template
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.notification_templates is 'Templates for SMS and WhatsApp notifications';
comment on column public.notification_templates.template_type is 'Type of notification: CONTRIBUTION_REMINDER, PERIODIC_TOTAL, GROUP_REPORT, etc.';
comment on column public.notification_templates.variables is 'JSON object describing available template variables';

-- Indexes
create index if not exists idx_notification_templates_institution_type 
  on public.notification_templates (institution_id, template_type, is_active);

-- ============================================================================
-- STEP 4: Create notification_logs table
-- ============================================================================

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  recipient_type text not null check (recipient_type in ('MEMBER', 'LEADER', 'GROUP')),
  recipient_id uuid, -- member_id or group_id
  recipient_phone text not null,
  channel text not null check (channel in ('SMS', 'WHATSAPP')),
  template_type text,
  message_body text not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'SENT', 'FAILED', 'DELIVERED')),
  external_id text, -- ID from SMS/WhatsApp provider
  error_message text,
  metadata jsonb default '{}'::jsonb,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.notification_logs is 'Log of all notifications sent via SMS or WhatsApp';

-- Indexes
create index if not exists idx_notification_logs_institution 
  on public.notification_logs (institution_id, created_at desc);
create index if not exists idx_notification_logs_recipient 
  on public.notification_logs (recipient_id, recipient_type);
create index if not exists idx_notification_logs_status 
  on public.notification_logs (status, created_at desc);

-- ============================================================================
-- STEP 5: Create group_reports table for PDF reports
-- ============================================================================

create table if not exists public.group_reports (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  report_type text not null check (report_type in ('WEEKLY', 'MONTHLY', 'OVERALL')),
  period_start date,
  period_end date,
  pdf_url text, -- URL to stored PDF
  pdf_storage_path text, -- Storage path in Supabase Storage
  summary jsonb not null default '{}'::jsonb, -- Summary data: total contributions, member counts, etc.
  member_contributions jsonb not null default '[]'::jsonb, -- Array of member contribution data
  generated_at timestamptz not null default now(),
  generated_by uuid references auth.users(id),
  sent_to_leaders boolean not null default false,
  sent_at timestamptz
);

comment on table public.group_reports is 'Generated PDF reports for groups';
comment on column public.group_reports.summary is 'JSON summary: {total_contributions, member_count, period_total, overall_total}';
comment on column public.group_reports.member_contributions is 'JSON array: [{member_id, member_name, period_total, overall_total}]';

-- Indexes
create index if not exists idx_group_reports_group 
  on public.group_reports (group_id, report_type, generated_at desc);
create index if not exists idx_group_reports_institution 
  on public.group_reports (institution_id, generated_at desc);

-- ============================================================================
-- STEP 6: Add WhatsApp settings to settings table
-- ============================================================================

alter table public.settings 
  add column if not exists whatsapp_enabled boolean not null default false,
  add column if not exists whatsapp_phone_id text,
  add column if not exists whatsapp_business_id text,
  add column if not exists whatsapp_verify_token text;

comment on column public.settings.whatsapp_enabled is 'Whether WhatsApp notifications are enabled';
comment on column public.settings.whatsapp_phone_id is 'WhatsApp Phone Number ID';
comment on column public.settings.whatsapp_business_id is 'WhatsApp Business Account ID';

-- ============================================================================
-- STEP 7: Add daily_contribution flag to groups table
-- ============================================================================

alter table public.groups 
  add column if not exists daily_contribution boolean not null default false;

comment on column public.groups.daily_contribution is 'Whether this group requires daily contributions (like "buri munsi")';

-- ============================================================================
-- STEP 8: Create RLS policies
-- ============================================================================

alter table public.notification_templates enable row level security;
alter table public.notification_logs enable row level security;
alter table public.group_reports enable row level security;

-- Notification templates
drop policy if exists "notification_templates_access" on public.notification_templates;
create policy "notification_templates_access"
on public.notification_templates
for all
using (
  public.is_platform_admin() 
  or institution_id = public.current_institution_id()
)
with check (
  public.is_platform_admin() 
  or institution_id = public.current_institution_id()
);

-- Notification logs
drop policy if exists "notification_logs_access" on public.notification_logs;
create policy "notification_logs_access"
on public.notification_logs
for all
using (
  public.is_platform_admin() 
  or institution_id = public.current_institution_id()
)
with check (
  public.is_platform_admin() 
  or institution_id = public.current_institution_id()
);

-- Group reports
drop policy if exists "group_reports_access" on public.group_reports;
create policy "group_reports_access"
on public.group_reports
for all
using (
  public.is_platform_admin() 
  or institution_id = public.current_institution_id()
)
with check (
  public.is_platform_admin() 
  or institution_id = public.current_institution_id()
);

-- ============================================================================
-- STEP 9: Seed default notification templates
-- ============================================================================

-- Function to seed templates for an institution
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
end;
$$;

-- ============================================================================
-- STEP 10: Create function to get group leaders
-- ============================================================================

create or replace function public.get_group_leaders(p_group_id uuid)
returns table (
  member_id uuid,
  member_name text,
  phone text,
  role group_member_role
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    m.id as member_id,
    m.full_name as member_name,
    m.phone,
    gm.role
  from public.group_members gm
  inner join public.members m on m.id = gm.member_id
  where gm.group_id = p_group_id
    and gm.role in ('LEADER', 'CHAIRPERSON')
    and gm.status = 'GOOD_STANDING'
    and m.status = 'ACTIVE';
end;
$$;

-- ============================================================================
-- STEP 11: Create function to get member contributions summary
-- ============================================================================

create or replace function public.get_member_contributions_summary(
  p_member_id uuid,
  p_group_id uuid,
  p_period_start date default null,
  p_period_end date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period_total numeric;
  v_overall_total numeric;
  v_period_count integer;
  v_overall_count integer;
begin
  -- Period total
  select 
    coalesce(sum(amount), 0),
    count(*)
  into v_period_total, v_period_count
  from public.transactions
  where member_id = p_member_id
    and group_id = p_group_id
    and type = 'CONTRIBUTION'
    and status = 'COMPLETED'
    and (p_period_start is null or occurred_at::date >= p_period_start)
    and (p_period_end is null or occurred_at::date <= p_period_end);

  -- Overall total
  select 
    coalesce(sum(amount), 0),
    count(*)
  into v_overall_total, v_overall_count
  from public.transactions
  where member_id = p_member_id
    and group_id = p_group_id
    and type = 'CONTRIBUTION'
    and status = 'COMPLETED';

  return jsonb_build_object(
    'period_total', v_period_total,
    'overall_total', v_overall_total,
    'period_count', v_period_count,
    'overall_count', v_overall_count
  );
end;
$$;

-- ============================================================================
-- STEP 12: Create function to get group contributions summary
-- ============================================================================

create or replace function public.get_group_contributions_summary(
  p_group_id uuid,
  p_period_start date default null,
  p_period_end date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period_total numeric;
  v_overall_total numeric;
  v_member_count integer;
  v_member_contributions jsonb;
begin
  -- Period total
  select coalesce(sum(amount), 0)
  into v_period_total
  from public.transactions
  where group_id = p_group_id
    and type = 'CONTRIBUTION'
    and status = 'COMPLETED'
    and (p_period_start is null or occurred_at::date >= p_period_start)
    and (p_period_end is null or occurred_at::date <= p_period_end);

  -- Overall total
  select coalesce(sum(amount), 0)
  into v_overall_total
  from public.transactions
  where group_id = p_group_id
    and type = 'CONTRIBUTION'
    and status = 'COMPLETED';

  -- Member count
  select count(distinct member_id)
  into v_member_count
  from public.group_members
  where group_id = p_group_id
    and status = 'GOOD_STANDING';

  -- Member contributions breakdown
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'member_id', m.id,
      'member_name', m.full_name,
      'phone', m.phone,
      'period_total', public.get_member_contributions_summary(m.id, p_group_id, p_period_start, p_period_end)->>'period_total',
      'overall_total', public.get_member_contributions_summary(m.id, p_group_id)->>'overall_total'
    )
  ), '[]'::jsonb)
  into v_member_contributions
  from public.group_members gm
  inner join public.members m on m.id = gm.member_id
  where gm.group_id = p_group_id
    and gm.status = 'GOOD_STANDING'
    and m.status = 'ACTIVE';

  return jsonb_build_object(
    'period_total', v_period_total,
    'overall_total', v_overall_total,
    'member_count', v_member_count,
    'member_contributions', v_member_contributions
  );
end;
$$;

-- ============================================================================
-- STEP 13: Add updated_at trigger for notification_templates
-- ============================================================================

drop trigger if exists set_notification_templates_updated_at on public.notification_templates;
create trigger set_notification_templates_updated_at
before update on public.notification_templates
for each row execute function public.set_updated_at();
