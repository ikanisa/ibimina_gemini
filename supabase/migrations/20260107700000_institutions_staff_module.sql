-- ============================================================================
-- Migration: Institutions + Staff/User Management Module
-- Purpose: Admin control plane for tenant scoping
-- ============================================================================

-- ============================================================================
-- STEP 1: Add is_active to profiles if not exists
-- ============================================================================

alter table public.profiles
  add column if not exists is_active boolean not null default true;

comment on column public.profiles.is_active is 'Whether the staff account is active (can log in)';

-- ============================================================================
-- STEP 2: Create staff_invites table for auditable invites
-- ============================================================================

create table if not exists public.staff_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  role text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  invited_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  expires_at timestamptz default (now() + interval '7 days'),
  metadata jsonb default '{}'::jsonb
);

-- Indexes
create index if not exists idx_staff_invites_email on public.staff_invites(email);
create index if not exists idx_staff_invites_institution on public.staff_invites(institution_id);
create index if not exists idx_staff_invites_status on public.staff_invites(status);

comment on table public.staff_invites is 'Auditable staff invitation records';

-- ============================================================================
-- STEP 3: Add contact and region to institutions
-- ============================================================================

alter table public.institutions
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists region text;

-- ============================================================================
-- STEP 4: Enable RLS on staff_invites
-- ============================================================================

alter table public.staff_invites enable row level security;

-- Platform admin full access
drop policy if exists "staff_invites_platform_admin" on public.staff_invites;
create policy "staff_invites_platform_admin" on public.staff_invites
  for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Institution admin can view/create invites for their institution
drop policy if exists "staff_invites_institution_admin" on public.staff_invites;
create policy "staff_invites_institution_admin" on public.staff_invites
  for all
  using (
    institution_id = public.current_institution_id()
    and exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
      and p.role in ('INSTITUTION_ADMIN')
    )
  )
  with check (
    institution_id = public.current_institution_id()
    and exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
      and p.role in ('INSTITUTION_ADMIN')
    )
  );

-- ============================================================================
-- STEP 5: Add indexes for profiles queries
-- ============================================================================

create index if not exists idx_profiles_institution on public.profiles(institution_id);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_is_active on public.profiles(is_active);

-- ============================================================================
-- STEP 6: RPC - create_institution
-- ============================================================================

create or replace function public.create_institution(
  p_name text,
  p_type text default 'SACCO',
  p_status text default 'ACTIVE',
  p_code text default null,
  p_supervisor text default null,
  p_contact_email text default null,
  p_contact_phone text default null,
  p_region text default null,
  p_momo_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_institution_id uuid;
  v_momo_code_id uuid;
begin
  -- Only platform admin can create institutions
  if not public.is_platform_admin() then
    raise exception 'Only platform admins can create institutions';
  end if;

  -- Validate name
  if trim(p_name) = '' then
    raise exception 'Institution name is required';
  end if;

  -- Validate type
  if p_type not in ('BANK', 'MFI', 'SACCO') then
    raise exception 'Invalid institution type. Must be BANK, MFI, or SACCO';
  end if;

  -- Insert institution
  insert into public.institutions (
    name, type, status, code, supervisor, contact_email, contact_phone, region
  ) values (
    trim(p_name),
    p_type::institution_type,
    coalesce(p_status, 'ACTIVE'),
    nullif(trim(p_code), ''),
    nullif(trim(p_supervisor), ''),
    nullif(trim(p_contact_email), ''),
    nullif(trim(p_contact_phone), ''),
    nullif(trim(p_region), '')
  )
  returning id into v_institution_id;

  -- If MoMo code provided, set it as primary
  if p_momo_code is not null and trim(p_momo_code) != '' then
    insert into public.institution_momo_codes (institution_id, momo_code, is_active, is_primary)
    values (v_institution_id, trim(p_momo_code), true, true)
    returning id into v_momo_code_id;
  end if;

  -- Audit log
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    auth.uid(),
    v_institution_id,
    'create_institution',
    'institution',
    v_institution_id,
    jsonb_build_object(
      'name', trim(p_name),
      'type', p_type,
      'status', p_status,
      'momo_code', p_momo_code
    )
  );

  return v_institution_id;
end;
$$;

comment on function public.create_institution is 'Creates a new institution (PLATFORM_ADMIN only)';

grant execute on function public.create_institution(text, text, text, text, text, text, text, text, text) to authenticated;

-- ============================================================================
-- STEP 7: RPC - update_institution
-- ============================================================================

create or replace function public.update_institution(
  p_institution_id uuid,
  p_name text default null,
  p_status text default null,
  p_code text default null,
  p_supervisor text default null,
  p_contact_email text default null,
  p_contact_phone text default null,
  p_region text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_data jsonb;
  v_institution public.institutions;
begin
  -- Check permissions
  if not (
    public.is_platform_admin()
    or (
      p_institution_id = public.current_institution_id()
      and exists (
        select 1 from public.profiles p
        where p.user_id = auth.uid()
        and p.role = 'INSTITUTION_ADMIN'
      )
    )
  ) then
    raise exception 'Permission denied';
  end if;

  -- Get current institution
  select * into v_institution from public.institutions where id = p_institution_id;
  if not found then
    raise exception 'Institution not found';
  end if;

  v_old_data := to_jsonb(v_institution);

  -- Cannot activate institution without primary MoMo code
  if p_status = 'ACTIVE' and v_institution.status != 'ACTIVE' then
    if not exists (
      select 1 from public.institution_momo_codes
      where institution_id = p_institution_id and is_primary = true and is_active = true
    ) then
      raise exception 'Cannot activate institution without a primary MoMo code';
    end if;
  end if;

  -- Update institution
  update public.institutions
  set
    name = coalesce(nullif(trim(p_name), ''), name),
    status = coalesce(p_status, status),
    code = case when p_code is null then code else nullif(trim(p_code), '') end,
    supervisor = case when p_supervisor is null then supervisor else nullif(trim(p_supervisor), '') end,
    contact_email = case when p_contact_email is null then contact_email else nullif(trim(p_contact_email), '') end,
    contact_phone = case when p_contact_phone is null then contact_phone else nullif(trim(p_contact_phone), '') end,
    region = case when p_region is null then region else nullif(trim(p_region), '') end
  where id = p_institution_id;

  -- Audit log
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    auth.uid(),
    p_institution_id,
    'update_institution',
    'institution',
    p_institution_id,
    jsonb_build_object(
      'old', v_old_data,
      'changes', jsonb_build_object(
        'name', p_name,
        'status', p_status,
        'code', p_code
      )
    )
  );

  -- If suspending institution, deactivate all staff
  if p_status = 'SUSPENDED' and v_institution.status != 'SUSPENDED' then
    update public.profiles
    set is_active = false
    where institution_id = p_institution_id and role != 'PLATFORM_ADMIN';

    insert into public.audit_log (
      actor_user_id, institution_id, action, entity_type, entity_id, metadata
    ) values (
      auth.uid(),
      p_institution_id,
      'suspend_institution_staff',
      'institution',
      p_institution_id,
      jsonb_build_object('reason', 'Institution suspended')
    );
  end if;
end;
$$;

comment on function public.update_institution is 'Updates an institution';

grant execute on function public.update_institution(uuid, text, text, text, text, text, text, text) to authenticated;

-- ============================================================================
-- STEP 8: RPC - update_staff_role
-- ============================================================================

create or replace function public.update_staff_role(
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_profile public.profiles;
  v_actor_role text;
  v_actor_institution_id uuid;
begin
  -- Get actor info
  select role, institution_id into v_actor_role, v_actor_institution_id
  from public.profiles where user_id = auth.uid();

  -- Get target profile
  select * into v_target_profile from public.profiles where user_id = p_user_id;
  if not found then
    raise exception 'Staff member not found';
  end if;

  -- Validate role
  if p_role not in ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'INSTITUTION_STAFF', 'INSTITUTION_TREASURER', 'INSTITUTION_AUDITOR') then
    raise exception 'Invalid role';
  end if;

  -- Permission checks
  if v_actor_role = 'PLATFORM_ADMIN' then
    -- Platform admin can update any role
    null;
  elsif v_actor_role = 'INSTITUTION_ADMIN' then
    -- Institution admin can only update staff in their institution
    if v_target_profile.institution_id != v_actor_institution_id then
      raise exception 'Cannot update staff from another institution';
    end if;
    -- Cannot promote to platform admin
    if p_role = 'PLATFORM_ADMIN' then
      raise exception 'Cannot promote to platform admin';
    end if;
    -- Cannot demote another institution admin
    if v_target_profile.role = 'INSTITUTION_ADMIN' and p_user_id != auth.uid() then
      raise exception 'Cannot demote another institution admin';
    end if;
  else
    raise exception 'Permission denied';
  end if;

  -- Update role
  update public.profiles
  set role = p_role::user_role, updated_at = now()
  where user_id = p_user_id;

  -- Audit log
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    auth.uid(),
    v_target_profile.institution_id,
    'update_staff_role',
    'profile',
    p_user_id,
    jsonb_build_object(
      'old_role', v_target_profile.role,
      'new_role', p_role,
      'staff_email', v_target_profile.email
    )
  );
end;
$$;

comment on function public.update_staff_role is 'Updates a staff member''s role';

grant execute on function public.update_staff_role(uuid, text) to authenticated;

-- ============================================================================
-- STEP 9: RPC - deactivate_staff
-- ============================================================================

create or replace function public.deactivate_staff(
  p_user_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_profile public.profiles;
  v_actor_role text;
  v_actor_institution_id uuid;
begin
  -- Get actor info
  select role, institution_id into v_actor_role, v_actor_institution_id
  from public.profiles where user_id = auth.uid();

  -- Get target profile
  select * into v_target_profile from public.profiles where user_id = p_user_id;
  if not found then
    raise exception 'Staff member not found';
  end if;

  -- Cannot deactivate yourself
  if p_user_id = auth.uid() then
    raise exception 'Cannot deactivate your own account';
  end if;

  -- Permission checks
  if v_actor_role = 'PLATFORM_ADMIN' then
    null; -- Can deactivate anyone
  elsif v_actor_role = 'INSTITUTION_ADMIN' then
    if v_target_profile.institution_id != v_actor_institution_id then
      raise exception 'Cannot deactivate staff from another institution';
    end if;
    if v_target_profile.role = 'PLATFORM_ADMIN' then
      raise exception 'Cannot deactivate a platform admin';
    end if;
  else
    raise exception 'Permission denied';
  end if;

  -- Deactivate
  update public.profiles
  set 
    is_active = false,
    status = 'SUSPENDED',
    updated_at = now()
  where user_id = p_user_id;

  -- Audit log
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    auth.uid(),
    v_target_profile.institution_id,
    'deactivate_staff',
    'profile',
    p_user_id,
    jsonb_build_object(
      'staff_email', v_target_profile.email,
      'reason', p_reason
    )
  );
end;
$$;

comment on function public.deactivate_staff is 'Deactivates a staff member (blocks login)';

grant execute on function public.deactivate_staff(uuid, text) to authenticated;

-- ============================================================================
-- STEP 10: RPC - reactivate_staff
-- ============================================================================

create or replace function public.reactivate_staff(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_profile public.profiles;
  v_actor_role text;
  v_actor_institution_id uuid;
  v_institution public.institutions;
begin
  -- Get actor info
  select role, institution_id into v_actor_role, v_actor_institution_id
  from public.profiles where user_id = auth.uid();

  -- Get target profile
  select * into v_target_profile from public.profiles where user_id = p_user_id;
  if not found then
    raise exception 'Staff member not found';
  end if;

  -- Check if institution is active
  select * into v_institution from public.institutions where id = v_target_profile.institution_id;
  if v_institution.status = 'SUSPENDED' then
    raise exception 'Cannot reactivate staff for a suspended institution';
  end if;

  -- Permission checks
  if v_actor_role = 'PLATFORM_ADMIN' then
    null; -- Can reactivate anyone
  elsif v_actor_role = 'INSTITUTION_ADMIN' then
    if v_target_profile.institution_id != v_actor_institution_id then
      raise exception 'Cannot reactivate staff from another institution';
    end if;
  else
    raise exception 'Permission denied';
  end if;

  -- Reactivate
  update public.profiles
  set 
    is_active = true,
    status = 'ACTIVE',
    updated_at = now()
  where user_id = p_user_id;

  -- Audit log
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    auth.uid(),
    v_target_profile.institution_id,
    'reactivate_staff',
    'profile',
    p_user_id,
    jsonb_build_object('staff_email', v_target_profile.email)
  );
end;
$$;

comment on function public.reactivate_staff is 'Reactivates a deactivated staff member';

grant execute on function public.reactivate_staff(uuid) to authenticated;

-- ============================================================================
-- STEP 11: RPC - reassign_staff_institution (PLATFORM_ADMIN only)
-- ============================================================================

create or replace function public.reassign_staff_institution(
  p_user_id uuid,
  p_new_institution_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_profile public.profiles;
  v_new_institution public.institutions;
begin
  -- Only platform admin can reassign
  if not public.is_platform_admin() then
    raise exception 'Only platform admins can reassign staff to different institutions';
  end if;

  -- Get target profile
  select * into v_target_profile from public.profiles where user_id = p_user_id;
  if not found then
    raise exception 'Staff member not found';
  end if;

  -- Cannot reassign platform admin
  if v_target_profile.role = 'PLATFORM_ADMIN' then
    raise exception 'Cannot reassign platform admin to an institution';
  end if;

  -- Verify new institution exists
  select * into v_new_institution from public.institutions where id = p_new_institution_id;
  if not found then
    raise exception 'Target institution not found';
  end if;

  -- Reassign
  update public.profiles
  set 
    institution_id = p_new_institution_id,
    updated_at = now()
  where user_id = p_user_id;

  -- Audit log for old institution
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    auth.uid(),
    v_target_profile.institution_id,
    'transfer_staff_out',
    'profile',
    p_user_id,
    jsonb_build_object(
      'staff_email', v_target_profile.email,
      'from_institution', v_target_profile.institution_id,
      'to_institution', p_new_institution_id
    )
  );

  -- Audit log for new institution
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    auth.uid(),
    p_new_institution_id,
    'transfer_staff_in',
    'profile',
    p_user_id,
    jsonb_build_object(
      'staff_email', v_target_profile.email,
      'from_institution', v_target_profile.institution_id,
      'to_institution', p_new_institution_id
    )
  );
end;
$$;

comment on function public.reassign_staff_institution is 'Reassigns a staff member to a different institution (PLATFORM_ADMIN only)';

grant execute on function public.reassign_staff_institution(uuid, uuid) to authenticated;

-- ============================================================================
-- STEP 12: RPC - create_staff_invite
-- ============================================================================

create or replace function public.create_staff_invite(
  p_email text,
  p_institution_id uuid,
  p_role text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite_id uuid;
  v_actor_role text;
  v_actor_institution_id uuid;
begin
  -- Get actor info
  select role, institution_id into v_actor_role, v_actor_institution_id
  from public.profiles where user_id = auth.uid();

  -- Validate role
  if p_role not in ('INSTITUTION_ADMIN', 'INSTITUTION_STAFF', 'INSTITUTION_TREASURER', 'INSTITUTION_AUDITOR') then
    raise exception 'Invalid role for invitation. Cannot invite platform admins via this function.';
  end if;

  -- Permission checks
  if v_actor_role = 'PLATFORM_ADMIN' then
    null; -- Can invite to any institution
  elsif v_actor_role = 'INSTITUTION_ADMIN' then
    if p_institution_id != v_actor_institution_id then
      raise exception 'Cannot invite staff to another institution';
    end if;
    if p_role = 'INSTITUTION_ADMIN' then
      raise exception 'Cannot invite another institution admin';
    end if;
  else
    raise exception 'Permission denied';
  end if;

  -- Check for existing pending invite
  if exists (
    select 1 from public.staff_invites
    where email = lower(trim(p_email))
    and institution_id = p_institution_id
    and status = 'pending'
    and expires_at > now()
  ) then
    raise exception 'A pending invite already exists for this email';
  end if;

  -- Create invite
  insert into public.staff_invites (
    email, institution_id, role, invited_by, status
  ) values (
    lower(trim(p_email)),
    p_institution_id,
    p_role,
    auth.uid(),
    'pending'
  )
  returning id into v_invite_id;

  -- Audit log
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    auth.uid(),
    p_institution_id,
    'create_staff_invite',
    'staff_invite',
    v_invite_id,
    jsonb_build_object(
      'email', lower(trim(p_email)),
      'role', p_role
    )
  );

  return v_invite_id;
end;
$$;

comment on function public.create_staff_invite is 'Creates a staff invitation record';

grant execute on function public.create_staff_invite(text, uuid, text) to authenticated;

-- ============================================================================
-- STEP 13: RPC - revoke_staff_invite
-- ============================================================================

create or replace function public.revoke_staff_invite(
  p_invite_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.staff_invites;
  v_actor_role text;
  v_actor_institution_id uuid;
begin
  -- Get actor info
  select role, institution_id into v_actor_role, v_actor_institution_id
  from public.profiles where user_id = auth.uid();

  -- Get invite
  select * into v_invite from public.staff_invites where id = p_invite_id;
  if not found then
    raise exception 'Invite not found';
  end if;

  if v_invite.status != 'pending' then
    raise exception 'Can only revoke pending invites';
  end if;

  -- Permission checks
  if v_actor_role = 'PLATFORM_ADMIN' then
    null;
  elsif v_actor_role = 'INSTITUTION_ADMIN' then
    if v_invite.institution_id != v_actor_institution_id then
      raise exception 'Cannot revoke invite from another institution';
    end if;
  else
    raise exception 'Permission denied';
  end if;

  -- Revoke
  update public.staff_invites
  set status = 'revoked'
  where id = p_invite_id;

  -- Audit log
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    auth.uid(),
    v_invite.institution_id,
    'revoke_staff_invite',
    'staff_invite',
    p_invite_id,
    jsonb_build_object('email', v_invite.email)
  );
end;
$$;

comment on function public.revoke_staff_invite is 'Revokes a pending staff invitation';

grant execute on function public.revoke_staff_invite(uuid) to authenticated;

-- ============================================================================
-- STEP 14: Update profiles RLS for staff list visibility
-- ============================================================================

-- Staff cannot see profiles from other institutions (except platform admin)
drop policy if exists "profiles_select_staff" on public.profiles;
create policy "profiles_select_staff" on public.profiles
  for select
  using (
    -- Platform admin sees all
    public.is_platform_admin()
    -- Institution admin/staff see only their institution
    or (
      institution_id = public.current_institution_id()
    )
    -- Everyone can see their own profile
    or user_id = auth.uid()
  );

-- ============================================================================
-- STEP 15: Helper function to get institution staff count
-- ============================================================================

create or replace function public.get_institution_staff_count(p_institution_id uuid)
returns int
language sql
security definer
as $$
  select count(*)::int
  from public.profiles
  where institution_id = p_institution_id;
$$;

grant execute on function public.get_institution_staff_count(uuid) to authenticated;

-- ============================================================================
-- STEP 16: Helper function to get institution groups count
-- ============================================================================

create or replace function public.get_institution_groups_count(p_institution_id uuid)
returns int
language sql
security definer
as $$
  select count(*)::int
  from public.groups
  where institution_id = p_institution_id;
$$;

grant execute on function public.get_institution_groups_count(uuid) to authenticated;

-- ============================================================================
-- STEP 17: Helper function to get institution members count
-- ============================================================================

create or replace function public.get_institution_members_count(p_institution_id uuid)
returns int
language sql
security definer
as $$
  select count(*)::int
  from public.members
  where institution_id = p_institution_id;
$$;

grant execute on function public.get_institution_members_count(uuid) to authenticated;

-- ============================================================================
-- End of migration
-- ============================================================================

