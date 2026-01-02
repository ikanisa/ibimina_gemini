-- Migration to fix missing types, columns and complete schema setup

-- Create missing enum types
do $$ begin
  create type user_role as enum ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'INSTITUTION_STAFF', 'INSTITUTION_TREASURER', 'INSTITUTION_AUDITOR');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type staff_status as enum ('ACTIVE', 'SUSPENDED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type institution_type as enum ('SACCO', 'MFI', 'BANK', 'VC');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type group_status as enum ('ACTIVE', 'INACTIVE', 'PENDING');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type contribution_status as enum ('PENDING', 'CONFIRMED', 'DISPUTED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type payment_status as enum ('PENDING', 'MATCHED', 'UNMATCHED', 'IGNORED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type withdrawal_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'DISBURSED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type loan_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'CLOSED', 'DEFAULTED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type transaction_status as enum ('PENDING', 'COMPLETED', 'FAILED', 'RECONCILED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type kyc_status as enum ('PENDING', 'VERIFIED', 'REJECTED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type meeting_status as enum ('SCHEDULED', 'COMPLETED', 'CANCELLED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type group_member_role as enum ('CHAIR', 'TREASURER', 'SECRETARY', 'MEMBER');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type group_member_status as enum ('ACTIVE', 'INACTIVE', 'SUSPENDED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type reconciliation_status as enum ('OPEN', 'RESOLVED', 'IGNORED');
exception when duplicate_object then null;
end $$;

-- Add missing columns to transactions table
alter table public.transactions 
  add column if not exists group_id uuid references public.groups(id) on delete set null;

-- Create the missing index
create index if not exists idx_transactions_group_id on public.transactions (group_id);

-- Create profiles table if not exists (the most critical table)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  institution_id uuid references public.institutions(id) on delete set null,
  role user_role not null default 'INSTITUTION_STAFF',
  full_name text,
  branch text,
  avatar_url text,
  status staff_status not null default 'ACTIVE',
  last_login_at timestamptz,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Create security helper functions if not exist
create or replace function public.current_institution_id()
returns uuid as $$
  select institution_id from public.profiles where user_id = auth.uid();
$$ language sql stable security definer;

create or replace function public.current_user_role()
returns user_role as $$
  select role from public.profiles where user_id = auth.uid();
$$ language sql stable security definer;

create or replace function public.is_platform_admin()
returns boolean as $$
  select coalesce(
    (select role = 'PLATFORM_ADMIN' from public.profiles where user_id = auth.uid()),
    false
  );
$$ language sql stable security definer;

-- RLS policy for profiles
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

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update"
on public.profiles
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Trigger to auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'INSTITUTION_STAFF')
  )
  on conflict (user_id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger if not exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Create profile for existing user if not exists (for the current logged in user)
insert into public.profiles (user_id, email, role)
select id, email, 'PLATFORM_ADMIN'::user_role
from auth.users
where not exists (select 1 from public.profiles where profiles.user_id = auth.users.id)
on conflict (user_id) do nothing;
