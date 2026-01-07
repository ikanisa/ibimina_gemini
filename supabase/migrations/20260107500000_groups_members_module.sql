-- ============================================================================
-- Migration: Groups & Members Module
-- Purpose: Add group_code, member_code, constraints, and RPCs for CRUD + bulk import
-- ============================================================================

-- ============================================================================
-- STEP 1: Ensure required columns exist on groups
-- ============================================================================

-- Add group_code if not exists
alter table public.groups 
  add column if not exists group_code text;

-- Add useful metadata columns
alter table public.groups 
  add column if not exists description text;

comment on column public.groups.group_code is 'Unique code within institution for easy reference';

-- ============================================================================
-- STEP 2: Ensure required columns exist on members
-- ============================================================================

-- Add member_code if not exists (for CSV imports and allocation matching)
alter table public.members 
  add column if not exists member_code text;

-- Add phone_primary (alias for phone for consistency)
-- Note: existing 'phone' column remains the primary phone
alter table public.members 
  add column if not exists phone_alt text;

-- Ensure group_id exists (may have been added in previous migration)
alter table public.members 
  add column if not exists group_id uuid references public.groups(id) on delete set null;

comment on column public.members.member_code is 'Unique code within institution for CSV imports and matching';
comment on column public.members.phone_alt is 'Alternative phone number';

-- ============================================================================
-- STEP 3: Add unique constraints
-- ============================================================================

-- Unique group_code per institution (allow nulls)
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'groups_institution_group_code_unique'
  ) then
    -- First clean up any duplicate group codes
    update public.groups g
    set group_code = group_code || '_' || substring(id::text, 1, 4)
    where group_code is not null
      and exists (
        select 1 from public.groups g2 
        where g2.institution_id = g.institution_id 
          and g2.group_code = g.group_code 
          and g2.id < g.id
      );
    
    -- Create unique index (allows null group_codes)
    create unique index if not exists idx_groups_institution_group_code 
      on public.groups(institution_id, group_code) 
      where group_code is not null;
  end if;
end $$;

-- Unique member_code per institution (allow nulls)
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'members_institution_member_code_unique'
  ) then
    -- First clean up any duplicate member codes
    update public.members m
    set member_code = member_code || '_' || substring(id::text, 1, 4)
    where member_code is not null
      and exists (
        select 1 from public.members m2 
        where m2.institution_id = m.institution_id 
          and m2.member_code = m.member_code 
          and m2.id < m.id
      );
    
    -- Create unique index (allows null member_codes)
    create unique index if not exists idx_members_institution_member_code 
      on public.members(institution_id, member_code) 
      where member_code is not null;
  end if;
end $$;

-- ============================================================================
-- STEP 4: Add indexes for search and filtering
-- ============================================================================

-- Groups indexes
create index if not exists idx_groups_institution_name 
  on public.groups(institution_id, group_name);
create index if not exists idx_groups_institution_created 
  on public.groups(institution_id, created_at desc);
create index if not exists idx_groups_institution_status 
  on public.groups(institution_id, status);

-- Members indexes
create index if not exists idx_members_institution_group 
  on public.members(institution_id, group_id);
create index if not exists idx_members_institution_phone 
  on public.members(institution_id, phone);
create index if not exists idx_members_institution_name 
  on public.members(institution_id, full_name);
create index if not exists idx_members_institution_created 
  on public.members(institution_id, created_at desc);

-- ============================================================================
-- STEP 5: Trigger to enforce member.institution_id == group.institution_id
-- ============================================================================

create or replace function public.enforce_member_group_institution()
returns trigger as $$
declare
  v_group_institution_id uuid;
begin
  -- Only check if group_id is being set
  if new.group_id is not null then
    select institution_id into v_group_institution_id
    from public.groups
    where id = new.group_id;
    
    if v_group_institution_id is null then
      raise exception 'Group not found: %', new.group_id;
    end if;
    
    if v_group_institution_id != new.institution_id then
      raise exception 'Member institution_id (%) does not match group institution_id (%)', 
        new.institution_id, v_group_institution_id;
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_member_group_institution on public.members;
create trigger trigger_member_group_institution
  before insert or update on public.members
  for each row
  execute function public.enforce_member_group_institution();

-- ============================================================================
-- STEP 6: RPC - create_group
-- ============================================================================

create or replace function public.create_group(
  p_institution_id uuid,
  p_name text,
  p_group_code text default null,
  p_description text default null,
  p_meeting_day text default null,
  p_frequency text default 'Weekly',
  p_expected_amount numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_user_institution_id uuid;
  v_group_id uuid;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Get user's institution
  select institution_id into v_user_institution_id
  from public.profiles
  where user_id = v_user_id;
  
  -- Check access
  if not public.is_platform_admin() and p_institution_id != v_user_institution_id then
    raise exception 'Access denied: Cannot create groups in other institution';
  end if;
  
  -- Validate name
  if p_name is null or trim(p_name) = '' then
    raise exception 'Group name is required';
  end if;
  
  -- Check unique group_code if provided
  if p_group_code is not null and trim(p_group_code) != '' then
    if exists (
      select 1 from public.groups 
      where institution_id = p_institution_id 
        and group_code = trim(p_group_code)
    ) then
      raise exception 'Group code already exists: %', p_group_code;
    end if;
  end if;
  
  -- Insert group
  insert into public.groups (
    institution_id, group_name, group_code, meeting_day, frequency, expected_amount, status
  ) values (
    p_institution_id, 
    trim(p_name), 
    nullif(trim(p_group_code), ''),
    p_meeting_day,
    coalesce(p_frequency, 'Weekly'),
    coalesce(p_expected_amount, 0),
    'ACTIVE'
  ) returning id into v_group_id;
  
  -- Audit log
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    v_user_id, p_institution_id, 'create_group', 'group', v_group_id,
    jsonb_build_object('name', trim(p_name), 'group_code', p_group_code)
  );
  
  return v_group_id;
end;
$$;

-- ============================================================================
-- STEP 7: RPC - update_group
-- ============================================================================

create or replace function public.update_group(
  p_group_id uuid,
  p_name text default null,
  p_group_code text default null,
  p_status text default null,
  p_meeting_day text default null,
  p_expected_amount numeric default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_user_institution_id uuid;
  v_group record;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Get group
  select * into v_group from public.groups where id = p_group_id;
  
  if v_group.id is null then
    raise exception 'Group not found';
  end if;
  
  -- Get user's institution
  select institution_id into v_user_institution_id
  from public.profiles
  where user_id = v_user_id;
  
  -- Check access
  if not public.is_platform_admin() and v_group.institution_id != v_user_institution_id then
    raise exception 'Access denied';
  end if;
  
  -- Check status if deleting - don't allow if members exist
  if p_status = 'INACTIVE' or p_status = 'CLOSED' then
    if exists (select 1 from public.members where group_id = p_group_id and status = 'ACTIVE') then
      raise exception 'Cannot deactivate group with active members. Reassign members first.';
    end if;
  end if;
  
  -- Update group
  update public.groups
  set
    group_name = coalesce(nullif(trim(p_name), ''), group_name),
    group_code = case when p_group_code is null then group_code else nullif(trim(p_group_code), '') end,
    status = coalesce(p_status::group_status, status),
    meeting_day = coalesce(p_meeting_day, meeting_day),
    expected_amount = coalesce(p_expected_amount, expected_amount),
    updated_at = now()
  where id = p_group_id;
  
  -- Audit log
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    v_user_id, v_group.institution_id, 'update_group', 'group', p_group_id,
    jsonb_build_object('name', p_name, 'status', p_status)
  );
end;
$$;

-- ============================================================================
-- STEP 8: RPC - bulk_import_groups
-- ============================================================================

create or replace function public.bulk_import_groups(
  p_institution_id uuid,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_user_institution_id uuid;
  v_row jsonb;
  v_results jsonb := '[]'::jsonb;
  v_inserted int := 0;
  v_updated int := 0;
  v_failed int := 0;
  v_group_id uuid;
  v_name text;
  v_group_code text;
  v_row_num int := 0;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Get user's institution
  select institution_id into v_user_institution_id
  from public.profiles
  where user_id = v_user_id;
  
  -- Check access
  if not public.is_platform_admin() and p_institution_id != v_user_institution_id then
    raise exception 'Access denied';
  end if;
  
  -- Process each row
  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    v_row_num := v_row_num + 1;
    v_name := v_row->>'name';
    v_group_code := v_row->>'group_code';
    
    begin
      -- Validate name
      if v_name is null or trim(v_name) = '' then
        raise exception 'Row %: name is required', v_row_num;
      end if;
      
      -- Check if group_code exists (update) or insert new
      if v_group_code is not null and trim(v_group_code) != '' then
        select id into v_group_id
        from public.groups
        where institution_id = p_institution_id and group_code = trim(v_group_code);
        
        if v_group_id is not null then
          -- Update existing
          update public.groups
          set group_name = trim(v_name), updated_at = now()
          where id = v_group_id;
          v_updated := v_updated + 1;
          v_results := v_results || jsonb_build_object('row', v_row_num, 'status', 'updated', 'id', v_group_id);
          continue;
        end if;
      end if;
      
      -- Insert new group
      insert into public.groups (institution_id, group_name, group_code, status)
      values (p_institution_id, trim(v_name), nullif(trim(v_group_code), ''), 'ACTIVE')
      returning id into v_group_id;
      
      v_inserted := v_inserted + 1;
      v_results := v_results || jsonb_build_object('row', v_row_num, 'status', 'inserted', 'id', v_group_id);
      
    exception when others then
      v_failed := v_failed + 1;
      v_results := v_results || jsonb_build_object('row', v_row_num, 'status', 'failed', 'error', SQLERRM);
    end;
  end loop;
  
  -- Audit log
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    v_user_id, p_institution_id, 'bulk_import_groups', 'group', null,
    jsonb_build_object('inserted', v_inserted, 'updated', v_updated, 'failed', v_failed, 'total', v_row_num)
  );
  
  return jsonb_build_object(
    'inserted', v_inserted,
    'updated', v_updated,
    'failed', v_failed,
    'total', v_row_num,
    'results', v_results
  );
end;
$$;

-- ============================================================================
-- STEP 9: RPC - create_member
-- ============================================================================

create or replace function public.create_member(
  p_institution_id uuid,
  p_group_id uuid,
  p_full_name text,
  p_member_code text default null,
  p_phone_primary text default null,
  p_phone_alt text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_user_institution_id uuid;
  v_group_institution_id uuid;
  v_member_id uuid;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Get user's institution
  select institution_id into v_user_institution_id
  from public.profiles
  where user_id = v_user_id;
  
  -- Check access
  if not public.is_platform_admin() and p_institution_id != v_user_institution_id then
    raise exception 'Access denied: Cannot create members in other institution';
  end if;
  
  -- Validate name
  if p_full_name is null or trim(p_full_name) = '' then
    raise exception 'Full name is required';
  end if;
  
  -- Validate group belongs to institution
  if p_group_id is not null then
    select institution_id into v_group_institution_id
    from public.groups
    where id = p_group_id;
    
    if v_group_institution_id is null then
      raise exception 'Group not found';
    end if;
    
    if v_group_institution_id != p_institution_id then
      raise exception 'Group belongs to different institution';
    end if;
  end if;
  
  -- Check unique member_code if provided
  if p_member_code is not null and trim(p_member_code) != '' then
    if exists (
      select 1 from public.members 
      where institution_id = p_institution_id 
        and member_code = trim(p_member_code)
    ) then
      raise exception 'Member code already exists: %', p_member_code;
    end if;
  end if;
  
  -- Warn (but allow) duplicate phone
  -- This is a soft warning - the caller can decide what to do
  
  -- Insert member
  insert into public.members (
    institution_id, group_id, full_name, member_code, phone, phone_alt, status
  ) values (
    p_institution_id, 
    p_group_id,
    trim(p_full_name), 
    nullif(trim(p_member_code), ''),
    nullif(trim(p_phone_primary), ''),
    nullif(trim(p_phone_alt), ''),
    'ACTIVE'
  ) returning id into v_member_id;
  
  -- Also add to group_members junction table for backward compatibility
  if p_group_id is not null then
    insert into public.group_members (institution_id, group_id, member_id, role, status)
    values (p_institution_id, p_group_id, v_member_id, 'MEMBER', 'GOOD_STANDING')
    on conflict do nothing;
  end if;
  
  -- Audit log
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    v_user_id, p_institution_id, 'create_member', 'member', v_member_id,
    jsonb_build_object('name', trim(p_full_name), 'group_id', p_group_id, 'member_code', p_member_code)
  );
  
  return v_member_id;
end;
$$;

-- ============================================================================
-- STEP 10: RPC - update_member
-- ============================================================================

create or replace function public.update_member(
  p_member_id uuid,
  p_full_name text default null,
  p_phone_primary text default null,
  p_phone_alt text default null,
  p_status text default null,
  p_group_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_user_institution_id uuid;
  v_member record;
  v_old_group_id uuid;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Get member
  select * into v_member from public.members where id = p_member_id;
  
  if v_member.id is null then
    raise exception 'Member not found';
  end if;
  
  v_old_group_id := v_member.group_id;
  
  -- Get user's institution
  select institution_id into v_user_institution_id
  from public.profiles
  where user_id = v_user_id;
  
  -- Check access
  if not public.is_platform_admin() and v_member.institution_id != v_user_institution_id then
    raise exception 'Access denied';
  end if;
  
  -- If changing group, validate new group belongs to same institution
  if p_group_id is not null and p_group_id != v_member.group_id then
    if not exists (
      select 1 from public.groups 
      where id = p_group_id and institution_id = v_member.institution_id
    ) then
      raise exception 'New group not found or belongs to different institution';
    end if;
  end if;
  
  -- Update member
  update public.members
  set
    full_name = coalesce(nullif(trim(p_full_name), ''), full_name),
    phone = coalesce(nullif(trim(p_phone_primary), ''), phone),
    phone_alt = case when p_phone_alt is null then phone_alt else nullif(trim(p_phone_alt), '') end,
    status = coalesce(p_status, status),
    group_id = case when p_group_id is null then group_id else p_group_id end,
    updated_at = now()
  where id = p_member_id;
  
  -- If group changed, update group_members junction table
  if p_group_id is not null and p_group_id != v_old_group_id then
    -- Remove from old group
    delete from public.group_members 
    where member_id = p_member_id and group_id = v_old_group_id;
    
    -- Add to new group
    insert into public.group_members (institution_id, group_id, member_id, role, status)
    values (v_member.institution_id, p_group_id, p_member_id, 'MEMBER', 'GOOD_STANDING')
    on conflict do nothing;
  end if;
  
  -- Audit log
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    v_user_id, v_member.institution_id, 'update_member', 'member', p_member_id,
    jsonb_build_object(
      'name', p_full_name, 
      'status', p_status,
      'old_group_id', v_old_group_id,
      'new_group_id', p_group_id
    )
  );
end;
$$;

-- ============================================================================
-- STEP 11: RPC - bulk_import_members
-- ============================================================================

create or replace function public.bulk_import_members(
  p_institution_id uuid,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_user_institution_id uuid;
  v_row jsonb;
  v_results jsonb := '[]'::jsonb;
  v_inserted int := 0;
  v_updated int := 0;
  v_failed int := 0;
  v_member_id uuid;
  v_group_id uuid;
  v_full_name text;
  v_member_code text;
  v_phone_primary text;
  v_phone_alt text;
  v_group_code text;
  v_row_num int := 0;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Get user's institution
  select institution_id into v_user_institution_id
  from public.profiles
  where user_id = v_user_id;
  
  -- Check access
  if not public.is_platform_admin() and p_institution_id != v_user_institution_id then
    raise exception 'Access denied';
  end if;
  
  -- Process each row
  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    v_row_num := v_row_num + 1;
    v_full_name := v_row->>'full_name';
    v_member_code := v_row->>'member_code';
    v_phone_primary := v_row->>'phone_primary';
    v_phone_alt := v_row->>'phone_alt';
    v_group_code := v_row->>'group_code';
    
    begin
      -- Validate name
      if v_full_name is null or trim(v_full_name) = '' then
        raise exception 'Row %: full_name is required', v_row_num;
      end if;
      
      -- Resolve group_code to group_id
      v_group_id := null;
      if v_group_code is not null and trim(v_group_code) != '' then
        select id into v_group_id
        from public.groups
        where institution_id = p_institution_id and group_code = trim(v_group_code);
        
        if v_group_id is null then
          raise exception 'Row %: group_code not found: %', v_row_num, v_group_code;
        end if;
      end if;
      
      -- Check if member_code exists (update) or insert new
      if v_member_code is not null and trim(v_member_code) != '' then
        select id into v_member_id
        from public.members
        where institution_id = p_institution_id and member_code = trim(v_member_code);
        
        if v_member_id is not null then
          -- Update existing
          update public.members
          set 
            full_name = trim(v_full_name),
            phone = coalesce(nullif(trim(v_phone_primary), ''), phone),
            phone_alt = case when v_phone_alt is null then phone_alt else nullif(trim(v_phone_alt), '') end,
            group_id = coalesce(v_group_id, group_id),
            updated_at = now()
          where id = v_member_id;
          v_updated := v_updated + 1;
          v_results := v_results || jsonb_build_object('row', v_row_num, 'status', 'updated', 'id', v_member_id);
          continue;
        end if;
      end if;
      
      -- Insert new member
      insert into public.members (institution_id, group_id, full_name, member_code, phone, phone_alt, status)
      values (
        p_institution_id, 
        v_group_id,
        trim(v_full_name), 
        nullif(trim(v_member_code), ''),
        nullif(trim(v_phone_primary), ''),
        nullif(trim(v_phone_alt), ''),
        'ACTIVE'
      ) returning id into v_member_id;
      
      -- Add to group_members junction table
      if v_group_id is not null then
        insert into public.group_members (institution_id, group_id, member_id, role, status)
        values (p_institution_id, v_group_id, v_member_id, 'MEMBER', 'GOOD_STANDING')
        on conflict do nothing;
      end if;
      
      v_inserted := v_inserted + 1;
      v_results := v_results || jsonb_build_object('row', v_row_num, 'status', 'inserted', 'id', v_member_id);
      
    exception when others then
      v_failed := v_failed + 1;
      v_results := v_results || jsonb_build_object('row', v_row_num, 'status', 'failed', 'error', SQLERRM);
    end;
  end loop;
  
  -- Audit log
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    v_user_id, p_institution_id, 'bulk_import_members', 'member', null,
    jsonb_build_object('inserted', v_inserted, 'updated', v_updated, 'failed', v_failed, 'total', v_row_num)
  );
  
  return jsonb_build_object(
    'inserted', v_inserted,
    'updated', v_updated,
    'failed', v_failed,
    'total', v_row_num,
    'results', v_results
  );
end;
$$;

-- ============================================================================
-- STEP 12: RPC - transfer_member_group (optional but useful)
-- ============================================================================

create or replace function public.transfer_member_group(
  p_member_id uuid,
  p_new_group_id uuid,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_user_institution_id uuid;
  v_member record;
  v_old_group_id uuid;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Get member
  select * into v_member from public.members where id = p_member_id;
  
  if v_member.id is null then
    raise exception 'Member not found';
  end if;
  
  v_old_group_id := v_member.group_id;
  
  -- Get user's institution
  select institution_id into v_user_institution_id
  from public.profiles
  where user_id = v_user_id;
  
  -- Check access
  if not public.is_platform_admin() and v_member.institution_id != v_user_institution_id then
    raise exception 'Access denied';
  end if;
  
  -- Validate new group belongs to same institution
  if not exists (
    select 1 from public.groups 
    where id = p_new_group_id and institution_id = v_member.institution_id
  ) then
    raise exception 'New group not found or belongs to different institution';
  end if;
  
  -- Update member's group
  update public.members
  set group_id = p_new_group_id, updated_at = now()
  where id = p_member_id;
  
  -- Update group_members junction table
  delete from public.group_members 
  where member_id = p_member_id and group_id = v_old_group_id;
  
  insert into public.group_members (institution_id, group_id, member_id, role, status)
  values (v_member.institution_id, p_new_group_id, p_member_id, 'MEMBER', 'GOOD_STANDING')
  on conflict do nothing;
  
  -- Audit log
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    v_user_id, v_member.institution_id, 'transfer_member_group', 'member', p_member_id,
    jsonb_build_object(
      'old_group_id', v_old_group_id,
      'new_group_id', p_new_group_id,
      'note', p_note
    )
  );
end;
$$;

-- ============================================================================
-- STEP 13: Grant permissions
-- ============================================================================

grant execute on function public.create_group(uuid, text, text, text, text, text, numeric) to authenticated;
grant execute on function public.update_group(uuid, text, text, text, text, numeric) to authenticated;
grant execute on function public.bulk_import_groups(uuid, jsonb) to authenticated;
grant execute on function public.create_member(uuid, uuid, text, text, text, text) to authenticated;
grant execute on function public.update_member(uuid, text, text, text, text, uuid) to authenticated;
grant execute on function public.bulk_import_members(uuid, jsonb) to authenticated;
grant execute on function public.transfer_member_group(uuid, uuid, text) to authenticated;

-- ============================================================================
-- End of migration
-- ============================================================================

