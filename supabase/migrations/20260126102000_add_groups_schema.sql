-- ============================================================================
-- Migration: Add Groups Schema Enhancements
-- Purpose: Add group types, global invite codes, enforce one-group-per-user, AND link members to auth.users
-- ============================================================================

-- 1. Add Group Type Enum
do $$ begin
  create type group_type as enum ('PRIVATE', 'PUBLIC');
exception when duplicate_object then null;
end $$;

-- 2. Add columns to groups table
alter table public.groups 
  add column if not exists type group_type default 'PRIVATE',
  add column if not exists invite_code text;

-- 3. Create unique index for global invite code
create unique index if not exists idx_groups_invite_code 
  on public.groups(invite_code);

-- 4. Link Members to Auth Users (Crucial for Mobile App)
alter table public.members 
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create unique index if not exists idx_members_user_id 
  on public.members(user_id);

-- 5. Enforce One-Group-Per-User Rule
create unique index if not exists idx_group_members_single_active 
  on public.group_members(member_id)
  where status not in ('INACTIVE', 'SUSPENDED', 'REJECTED', 'LEFT'); 

-- 6. Helper Function to Join via Invite Code
create or replace function public.join_group_via_invite(
  p_invite_code text,
  p_member_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_group_institution_id uuid;
  v_group_type group_type;
  v_membership_id uuid;
  v_existing_group uuid;
begin
  -- 1. Find group by code
  select id, institution_id, type into v_group_id, v_group_institution_id, v_group_type
  from public.groups
  where invite_code = p_invite_code
  limit 1;

  if v_group_id is null then
    raise exception 'Invalid invite code';
  end if;

  -- 2. Check if user is already in a group (Active)
  select group_id into v_existing_group
  from public.group_members
  where member_id = p_member_id
    and status not in ('INACTIVE', 'SUSPENDED');
  
  if v_existing_group is not null then
    if v_existing_group = v_group_id then
      return jsonb_build_object('status', 'already_member', 'group_id', v_group_id);
    else
      raise exception 'User is already a member of another group';
    end if;
  end if;

  -- 3. Add to group
  insert into public.group_members (
    institution_id,
    group_id,
    member_id,
    role,
    status
  )
  values (
    v_group_institution_id,
    v_group_id,
    p_member_id,
    'MEMBER',
    'GOOD_STANDING'
  )
  returning id into v_membership_id;

  return jsonb_build_object('status', 'joined', 'group_id', v_group_id, 'membership_id', v_membership_id);
end;
$$;
