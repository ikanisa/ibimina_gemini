-- ============================================================================
-- AGGRESSIVE SCHEMA CONSOLIDATION
-- Purpose: Consolidate and delete redundant tables per requirements
-- Date: 2026-01-10
-- ============================================================================
-- 
-- This migration:
-- 1. Deletes branches table
-- 2. Consolidates group_members into groups (flatten many-to-many)
-- 3. Consolidates institution_settings into institutions
-- 4. Deletes loans, meetings tables
-- 5. Consolidates reconciliation_items into reconciliation_sessions
-- 6. Checks for and deletes payers table if exists
-- ============================================================================

-- ============================================================================
-- STEP 1: Consolidate institution_settings into institutions
-- ============================================================================

-- Add institution_settings columns to institutions table
do $$
begin
  -- Parsing configuration
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'institutions' and column_name = 'parsing_mode') then
    alter table public.institutions 
    add column parsing_mode text default 'deterministic' check (parsing_mode in ('deterministic', 'ai_fallback'));
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'institutions' and column_name = 'confidence_threshold') then
    alter table public.institutions 
    add column confidence_threshold numeric(3, 2) default 0.85 check (confidence_threshold >= 0.5 and confidence_threshold <= 1.0);
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'institutions' and column_name = 'dedupe_window_minutes') then
    alter table public.institutions 
    add column dedupe_window_minutes int default 60 check (dedupe_window_minutes >= 5 and dedupe_window_minutes <= 1440);
  end if;
  
  -- Notification settings
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'institutions' and column_name = 'low_confidence_alert_enabled') then
    alter table public.institutions 
    add column low_confidence_alert_enabled boolean default true;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'institutions' and column_name = 'unallocated_alert_threshold') then
    alter table public.institutions 
    add column unallocated_alert_threshold int default 10;
  end if;
end $$;

-- Migrate data from institution_settings to institutions
update public.institutions i
set 
  parsing_mode = coalesce(is.parsing_mode, 'deterministic'),
  confidence_threshold = coalesce(is.confidence_threshold, 0.85),
  dedupe_window_minutes = coalesce(is.dedupe_window_minutes, 60),
  low_confidence_alert_enabled = coalesce(is.low_confidence_alert_enabled, true),
  unallocated_alert_threshold = coalesce(is.unallocated_alert_threshold, 10)
from public.institution_settings is
where i.id = is.institution_id;

-- Drop institution_settings table
drop table if exists public.institution_settings CASCADE;

-- ============================================================================
-- STEP 2: Consolidate group_members into groups (store as JSONB array)
-- ============================================================================

-- Add members column to groups (JSONB array of member data)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'groups' and column_name = 'members') then
    alter table public.groups 
    add column members jsonb default '[]'::jsonb;
  end if;
end $$;

-- Migrate group_members data into groups.members JSONB
update public.groups g
set members = (
  select jsonb_agg(
    jsonb_build_object(
      'member_id', gm.member_id,
      'role', gm.role,
      'status', gm.status,
      'joined_date', gm.joined_date,
      'created_at', gm.created_at
    )
  )
  from public.group_members gm
  where gm.group_id = g.id
)
where exists (select 1 from public.group_members where group_id = g.id);

-- Drop group_members table
drop table if exists public.group_members CASCADE;

-- ============================================================================
-- STEP 3: Consolidate reconciliation_items into reconciliation_sessions
-- ============================================================================

-- Add items column to reconciliation_sessions (JSONB array)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'reconciliation_sessions' and column_name = 'items') then
    alter table public.reconciliation_sessions 
    add column items jsonb default '[]'::jsonb;
  end if;
end $$;

-- Migrate reconciliation_items data into reconciliation_sessions.items JSONB
update public.reconciliation_sessions rs
set items = (
  select jsonb_agg(
    jsonb_build_object(
      'id', ri.id,
      'transaction_id', ri.transaction_id,
      'issue_type', ri.issue_type,
      'resolution', ri.resolution,
      'resolved_by', ri.resolved_by,
      'resolved_at', ri.resolved_at,
      'metadata', ri.metadata
    )
  )
  from public.reconciliation_items ri
  where ri.session_id = rs.id
)
where exists (select 1 from public.reconciliation_items where session_id = rs.id);

-- Drop reconciliation_items table
drop table if exists public.reconciliation_items CASCADE;

-- ============================================================================
-- STEP 4: Delete branches table
-- ============================================================================

-- Remove foreign key constraints first
do $$
begin
  -- Check if any tables reference branches
  if exists (
    select 1 from information_schema.table_constraints 
    where constraint_type = 'FOREIGN KEY' 
    and constraint_name like '%branch%'
  ) then
    -- Drop any foreign keys (will be handled by CASCADE)
    raise notice 'Dropping branches table (CASCADE will handle dependencies)';
  end if;
end $$;

drop table if exists public.branches CASCADE;

-- ============================================================================
-- STEP 5: Delete loans table
-- ============================================================================

drop table if exists public.loans CASCADE;

-- ============================================================================
-- STEP 6: Delete meetings table
-- ============================================================================

drop table if exists public.meetings CASCADE;

-- ============================================================================
-- STEP 7: Delete payers table (if exists)
-- ============================================================================

drop table if exists public.payers CASCADE;

-- ============================================================================
-- STEP 8: Clean up any orphaned foreign key references
-- ============================================================================

-- Remove branch_id references from members (if column exists)
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'members' and column_name = 'branch_id') then
    alter table public.members drop column branch_id;
  end if;
end $$;

-- Remove meeting_id from transactions (if exists, meetings table is deleted)
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'transactions' and column_name = 'meeting_id') then
    alter table public.transactions drop column meeting_id;
  end if;
end $$;

-- Remove loan_id from transactions (if exists, loans table is deleted)
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'transactions' and column_name = 'loan_id') then
    alter table public.transactions drop column loan_id;
  end if;
end $$;

-- Note: members.branch (text) column can remain as it's just a text field, not a FK

-- ============================================================================
-- STEP 9: Update indexes and constraints
-- ============================================================================

-- Create index on groups.members for JSONB queries
create index if not exists idx_groups_members_gin 
  on public.groups using gin (members);

-- Create index on reconciliation_sessions.items for JSONB queries
create index if not exists idx_reconciliation_sessions_items_gin 
  on public.reconciliation_sessions using gin (items);

-- ============================================================================
-- STEP 10: Summary
-- ============================================================================

do $$
begin
  raise notice '=== AGGRESSIVE CONSOLIDATION COMPLETE ===';
  raise notice 'Consolidated:';
  raise notice '  - institution_settings → institutions';
  raise notice '  - group_members → groups.members (JSONB)';
  raise notice '  - reconciliation_items → reconciliation_sessions.items (JSONB)';
  raise notice '';
  raise notice 'Deleted:';
  raise notice '  - branches';
  raise notice '  - loans';
  raise notice '  - meetings';
  raise notice '  - payers (if existed)';
  raise notice '';
  raise notice 'Next steps:';
  raise notice '1. Update code to use groups.members JSONB instead of group_members table';
  raise notice '2. Update code to use reconciliation_sessions.items JSONB';
  raise notice '3. Update code to read settings from institutions table';
  raise notice '4. Remove branches, loans, meetings references from code';
end $$;
