-- Supabase schema for SACCO+ Admin Portal
-- Apply in Supabase SQL editor or via CLI migrations.

create extension if not exists "pgcrypto";

-- Enumerations
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum (
      'PLATFORM_ADMIN',
      'INSTITUTION_ADMIN',
      'INSTITUTION_STAFF',
      'INSTITUTION_TREASURER',
      'INSTITUTION_AUDITOR'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'institution_type') then
    create type institution_type as enum ('BANK', 'MFI', 'SACCO');
  end if;
  if not exists (select 1 from pg_type where typname = 'group_status') then
    create type group_status as enum ('ACTIVE', 'PAUSED', 'CLOSED');
  end if;
  if not exists (select 1 from pg_type where typname = 'contribution_status') then
    create type contribution_status as enum ('RECORDED', 'RECONCILED', 'FLAGGED');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('UNRECONCILED', 'RECONCILED', 'FLAGGED');
  end if;
  if not exists (select 1 from pg_type where typname = 'withdrawal_status') then
    create type withdrawal_status as enum ('REQUESTED', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED');
  end if;
  if not exists (select 1 from pg_type where typname = 'loan_status') then
    create type loan_status as enum ('PENDING_APPROVAL', 'ACTIVE', 'OVERDUE', 'CLOSED', 'REJECTED');
  end if;
  if not exists (select 1 from pg_type where typname = 'transaction_status') then
    create type transaction_status as enum ('COMPLETED', 'PENDING', 'FAILED', 'REVERSED');
  end if;
  if not exists (select 1 from pg_type where typname = 'kyc_status') then
    create type kyc_status as enum ('VERIFIED', 'PENDING', 'REJECTED');
  end if;
  if not exists (select 1 from pg_type where typname = 'staff_status') then
    create type staff_status as enum ('ACTIVE', 'SUSPENDED');
  end if;
  if not exists (select 1 from pg_type where typname = 'meeting_status') then
    create type meeting_status as enum ('SCHEDULED', 'COMPLETED');
  end if;
  if not exists (select 1 from pg_type where typname = 'group_member_role') then
    create type group_member_role as enum ('CHAIRPERSON', 'SECRETARY', 'TREASURER', 'MEMBER');
  end if;
  if not exists (select 1 from pg_type where typname = 'group_member_status') then
    create type group_member_status as enum ('GOOD_STANDING', 'IN_ARREARS', 'DEFAULTED');
  end if;
  if not exists (select 1 from pg_type where typname = 'reconciliation_status') then
    create type reconciliation_status as enum ('OPEN', 'RESOLVED', 'IGNORED');
  end if;
end $$;

-- Core entities
create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type institution_type not null,
  status text not null default 'ACTIVE',
  code text,
  supervisor text,
  total_assets numeric(16, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  institution_id uuid references public.institutions(id) on delete set null,
  role user_role not null default 'INSTITUTION_STAFF',
  email text,
  full_name text,
  branch text,
  avatar_url text,
  status staff_status not null default 'ACTIVE',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  group_name text not null,
  status group_status not null default 'ACTIVE',
  expected_amount numeric(14, 2) not null default 0,
  frequency text not null,
  grace_days integer not null default 0,
  bank_name text,
  account_ref text,
  currency text not null default 'RWF',
  meeting_day text,
  cycle_label text,
  fund_balance numeric(16, 2) not null default 0,
  active_loans_count integer not null default 0,
  next_meeting_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  full_name text not null,
  phone text not null,
  status text not null default 'ACTIVE',
  branch text,
  kyc_status kyc_status not null default 'PENDING',
  savings_balance numeric(16, 2) not null default 0,
  loan_balance numeric(16, 2) not null default 0,
  token_balance numeric(16, 2) not null default 0,
  avatar_url text,
  join_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  date date not null,
  type text not null,
  attendance_count integer not null default 0,
  total_collected numeric(16, 2) not null default 0,
  notes text,
  status meeting_status not null default 'SCHEDULED',
  created_at timestamptz not null default now()
);

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  member_id uuid references public.members(id) on delete set null,
  date date not null,
  amount numeric(14, 2) not null,
  method text not null,
  reference text,
  status contribution_status not null default 'RECORDED',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.incoming_payments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  received_date date not null,
  amount numeric(14, 2) not null,
  payer_ref text,
  reference text,
  raw_text text,
  status payment_status not null default 'UNRECONCILED',
  created_at timestamptz not null default now()
);

create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  member_id uuid references public.members(id) on delete set null,
  request_date date not null,
  amount numeric(14, 2) not null,
  status withdrawal_status not null default 'REQUESTED',
  payment_reference text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  manager_name text,
  manager_phone text,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  role group_member_role not null default 'MEMBER',
  status group_member_status not null default 'GOOD_STANDING',
  joined_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  type text not null,
  amount numeric(16, 2) not null,
  currency text not null default 'RWF',
  channel text not null,
  status transaction_status not null default 'COMPLETED',
  reference text,
  created_at timestamptz not null default now()
);

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  amount numeric(16, 2) not null,
  outstanding_balance numeric(16, 2) not null default 0,
  status loan_status not null default 'PENDING_APPROVAL',
  start_date date not null,
  next_payment_date date,
  interest_rate numeric(5, 2) not null default 0,
  term_months integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sms_messages (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  sender text not null,
  timestamp timestamptz not null,
  body text not null,
  is_parsed boolean not null default false,
  parsed_amount numeric(16, 2),
  parsed_currency text,
  parsed_transaction_id text,
  parsed_counterparty text,
  linked_transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.nfc_logs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  timestamp timestamptz not null,
  device_id text not null,
  tag_id text not null,
  action text not null,
  status text not null,
  member_id uuid references public.members(id) on delete set null,
  amount numeric(16, 2),
  linked_sms boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reconciliation_issues (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  source text not null,
  amount numeric(16, 2) not null,
  source_reference text,
  ledger_status text not null,
  status reconciliation_status not null default 'OPEN',
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  notes text,
  linked_transaction_id uuid references public.transactions(id) on delete set null
);

create table if not exists public.settings (
  institution_id uuid primary key references public.institutions(id) on delete cascade,
  system_name text not null default 'SACCO+ Admin Portal',
  support_email text,
  base_currency text not null default 'RWF',
  momo_shortcode text,
  momo_merchant_id text,
  auto_reconcile boolean not null default true,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Idempotent column additions (for existing databases)
alter table public.institutions add column if not exists code text;
alter table public.institutions add column if not exists supervisor text;
alter table public.institutions add column if not exists total_assets numeric(16, 2) not null default 0;

alter table public.profiles add column if not exists status staff_status not null default 'ACTIVE';
alter table public.profiles add column if not exists last_login_at timestamptz;
alter table public.profiles add column if not exists email text;

alter table public.groups add column if not exists meeting_day text;
alter table public.groups add column if not exists cycle_label text;
alter table public.groups add column if not exists fund_balance numeric(16, 2) not null default 0;
alter table public.groups add column if not exists active_loans_count integer not null default 0;
alter table public.groups add column if not exists next_meeting_date date;

alter table public.members add column if not exists branch text;
alter table public.members add column if not exists kyc_status kyc_status not null default 'PENDING';
alter table public.members add column if not exists savings_balance numeric(16, 2) not null default 0;
alter table public.members add column if not exists loan_balance numeric(16, 2) not null default 0;
alter table public.members add column if not exists token_balance numeric(16, 2) not null default 0;
alter table public.members add column if not exists avatar_url text;
alter table public.members add column if not exists join_date date;

alter table public.contributions add column if not exists meeting_id uuid references public.meetings(id) on delete set null;
alter table public.contributions add column if not exists channel text;

-- Data validation constraints
alter table public.groups add constraint if not exists check_frequency 
  check (frequency in ('Weekly', 'Monthly'));

-- Indexes
create index if not exists idx_profiles_institution_id on public.profiles (institution_id);
create index if not exists idx_groups_institution_id on public.groups (institution_id);
create index if not exists idx_members_institution_id on public.members (institution_id);
create index if not exists idx_contributions_institution_id on public.contributions (institution_id);
create index if not exists idx_contributions_group_id on public.contributions (group_id);
create index if not exists idx_contributions_member_id on public.contributions (member_id);
create index if not exists idx_incoming_payments_institution_id on public.incoming_payments (institution_id);
create index if not exists idx_withdrawals_institution_id on public.withdrawals (institution_id);
create index if not exists idx_branches_institution_id on public.branches (institution_id);
create index if not exists idx_group_members_institution_id on public.group_members (institution_id);
create index if not exists idx_group_members_group_id on public.group_members (group_id);
create index if not exists idx_group_members_member_id on public.group_members (member_id);
create index if not exists idx_meetings_institution_id on public.meetings (institution_id);
create index if not exists idx_meetings_group_id on public.meetings (group_id);
create index if not exists idx_transactions_institution_id on public.transactions (institution_id);
create index if not exists idx_transactions_member_id on public.transactions (member_id);
create index if not exists idx_transactions_group_id on public.transactions (group_id);
create index if not exists idx_loans_institution_id on public.loans (institution_id);
create index if not exists idx_loans_member_id on public.loans (member_id);
create index if not exists idx_loans_group_id on public.loans (group_id);
create index if not exists idx_sms_messages_institution_id on public.sms_messages (institution_id);
create index if not exists idx_nfc_logs_institution_id on public.nfc_logs (institution_id);
create index if not exists idx_reconciliation_issues_institution_id on public.reconciliation_issues (institution_id);

-- Performance indexes for common queries
create index if not exists idx_transactions_created_at on public.transactions (created_at DESC);
create index if not exists idx_contributions_date on public.contributions (date DESC);
create index if not exists idx_sms_messages_timestamp on public.sms_messages (timestamp DESC);
create index if not exists idx_transactions_institution_status on public.transactions (institution_id, status);
create index if not exists idx_contributions_institution_date on public.contributions (institution_id, date DESC);

-- Updated-at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_groups_updated_at on public.groups;
create trigger set_groups_updated_at
before update on public.groups
for each row execute function public.set_updated_at();

drop trigger if exists set_settings_updated_at on public.settings;
create trigger set_settings_updated_at
before update on public.settings
for each row execute function public.set_updated_at();

-- Profile bootstrap on new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    user_id,
    institution_id,
    role,
    email,
    full_name,
    branch,
    avatar_url,
    status,
    last_login_at
  ) values (
    new.id,
    case
      when (new.raw_user_meta_data ->> 'institution_id') ~* '^[0-9a-f-]{36}$'
        then (new.raw_user_meta_data ->> 'institution_id')::uuid
      else null
    end,
    case
      when new.raw_user_meta_data ->> 'role' is null then 'INSTITUTION_STAFF'
      when upper(new.raw_user_meta_data ->> 'role') in (
        'PLATFORM_ADMIN',
        'INSTITUTION_ADMIN',
        'INSTITUTION_STAFF',
        'INSTITUTION_TREASURER',
        'INSTITUTION_AUDITOR'
      ) then (upper(new.raw_user_meta_data ->> 'role'))::user_role
      else 'INSTITUTION_STAFF'
    end,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'branch',
    new.raw_user_meta_data ->> 'avatar_url',
    'ACTIVE',
    now()
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Security helper functions
create or replace function public.current_institution_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select institution_id from public.profiles where user_id = auth.uid();
$$;

create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid();
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'PLATFORM_ADMIN' from public.profiles where user_id = auth.uid()), false);
$$;

-- Row Level Security
alter table public.institutions enable row level security;
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.members enable row level security;
alter table public.contributions enable row level security;
alter table public.incoming_payments enable row level security;
alter table public.withdrawals enable row level security;
alter table public.branches enable row level security;
alter table public.group_members enable row level security;
alter table public.meetings enable row level security;
alter table public.transactions enable row level security;
alter table public.loans enable row level security;
alter table public.sms_messages enable row level security;
alter table public.nfc_logs enable row level security;
alter table public.reconciliation_issues enable row level security;
alter table public.settings enable row level security;

drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read"
on public.profiles
for select
using (
  user_id = auth.uid()
  or public.is_platform_admin()
  or (
    institution_id = public.current_institution_id()
    and public.current_user_role() in ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN')
  )
);

drop policy if exists "profiles_write" on public.profiles;
create policy "profiles_write"
on public.profiles
for all
using (
  user_id = auth.uid()
  or public.is_platform_admin()
  or (
    institution_id = public.current_institution_id()
    and public.current_user_role() in ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN')
  )
)
with check (
  user_id = auth.uid()
  or public.is_platform_admin()
  or (
    institution_id = public.current_institution_id()
    and public.current_user_role() in ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN')
  )
);

drop policy if exists "institutions_access" on public.institutions;
create policy "institutions_access"
on public.institutions
for all
using (public.is_platform_admin() or id = public.current_institution_id())
with check (public.is_platform_admin() or id = public.current_institution_id());

drop policy if exists "groups_access" on public.groups;
create policy "groups_access"
on public.groups
for all
using (public.is_platform_admin() or institution_id = public.current_institution_id())
with check (public.is_platform_admin() or institution_id = public.current_institution_id());

drop policy if exists "members_access" on public.members;
create policy "members_access"
on public.members
for all
using (public.is_platform_admin() or institution_id = public.current_institution_id())
with check (public.is_platform_admin() or institution_id = public.current_institution_id());

drop policy if exists "contributions_access" on public.contributions;
create policy "contributions_access"
on public.contributions
for all
using (public.is_platform_admin() or institution_id = public.current_institution_id())
with check (public.is_platform_admin() or institution_id = public.current_institution_id());

drop policy if exists "incoming_payments_access" on public.incoming_payments;
create policy "incoming_payments_access"
on public.incoming_payments
for all
using (public.is_platform_admin() or institution_id = public.current_institution_id())
with check (public.is_platform_admin() or institution_id = public.current_institution_id());

drop policy if exists "withdrawals_access" on public.withdrawals;
create policy "withdrawals_access"
on public.withdrawals
for all
using (public.is_platform_admin() or institution_id = public.current_institution_id())
with check (public.is_platform_admin() or institution_id = public.current_institution_id());

drop policy if exists "branches_access" on public.branches;
create policy "branches_access"
on public.branches
for all
using (public.is_platform_admin() or institution_id = public.current_institution_id())
with check (public.is_platform_admin() or institution_id = public.current_institution_id());

drop policy if exists "group_members_access" on public.group_members;
create policy "group_members_access"
on public.group_members
for all
using (public.is_platform_admin() or institution_id = public.current_institution_id())
with check (public.is_platform_admin() or institution_id = public.current_institution_id());

drop policy if exists "meetings_access" on public.meetings;
create policy "meetings_access"
on public.meetings
for all
using (public.is_platform_admin() or institution_id = public.current_institution_id())
with check (public.is_platform_admin() or institution_id = public.current_institution_id());

drop policy if exists "transactions_access" on public.transactions;
create policy "transactions_access"
on public.transactions
for all
using (public.is_platform_admin() or institution_id = public.current_institution_id())
with check (public.is_platform_admin() or institution_id = public.current_institution_id());

drop policy if exists "loans_access" on public.loans;
create policy "loans_access"
on public.loans
for all
using (public.is_platform_admin() or institution_id = public.current_institution_id())
with check (public.is_platform_admin() or institution_id = public.current_institution_id());

drop policy if exists "sms_messages_access" on public.sms_messages;
create policy "sms_messages_access"
on public.sms_messages
for all
using (public.is_platform_admin() or institution_id = public.current_institution_id())
with check (public.is_platform_admin() or institution_id = public.current_institution_id());

drop policy if exists "nfc_logs_access" on public.nfc_logs;
create policy "nfc_logs_access"
on public.nfc_logs
for all
using (public.is_platform_admin() or institution_id = public.current_institution_id())
with check (public.is_platform_admin() or institution_id = public.current_institution_id());

drop policy if exists "reconciliation_issues_access" on public.reconciliation_issues;
create policy "reconciliation_issues_access"
on public.reconciliation_issues
for all
using (public.is_platform_admin() or institution_id = public.current_institution_id())
with check (public.is_platform_admin() or institution_id = public.current_institution_id());

drop policy if exists "settings_access" on public.settings;
create policy "settings_access"
on public.settings
for all
using (public.is_platform_admin() or institution_id = public.current_institution_id())
with check (public.is_platform_admin() or institution_id = public.current_institution_id());
