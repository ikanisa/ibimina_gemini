-- ============================================================================
-- AGGRESSIVE SCHEMA CONSOLIDATION (MODIFIED)
-- Purpose: Consolidate and delete redundant tables per requirements
-- Date: 2026-01-10
-- Modified: 2026-01-11 - Keep group_members table (required for group leaders feature)
-- ============================================================================
-- 
-- This migration:
-- 1. Deletes branches table
-- 2. SKIPS group_members consolidation (required for group leaders feature)
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

-- Migrate data from institution_settings to institutions (only if table exists and has data)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'institution_settings') then
    update public.institutions i
    set 
      parsing_mode = coalesce(inst_settings.parsing_mode, 'deterministic'),
      confidence_threshold = coalesce(inst_settings.confidence_threshold, 0.85),
      dedupe_window_minutes = coalesce(inst_settings.dedupe_window_minutes, 60),
      low_confidence_alert_enabled = coalesce(inst_settings.low_confidence_alert_enabled, true)
    from public.institution_settings inst_settings
    where i.id = inst_settings.institution_id;
  end if;
end $$;

-- Drop institution_settings table
drop table if exists public.institution_settings CASCADE;

-- ============================================================================
-- STEP 2: SKIP group_members consolidation
-- NOTE: group_members table is REQUIRED for group leaders feature
-- The group_leaders_whatsapp migration (20260111000000) depends on this table
-- ============================================================================

do $$
begin
  raise notice 'Skipping group_members consolidation - table required for group leaders feature';
end $$;

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
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'reconciliation_items') then
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
  end if;
end $$;

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

-- Create index on reconciliation_sessions.items for JSONB queries
create index if not exists idx_reconciliation_sessions_items_gin 
  on public.reconciliation_sessions using gin (items);

-- ============================================================================
-- STEP 10: Summary
-- ============================================================================

do $$
begin
  raise notice '=== AGGRESSIVE CONSOLIDATION COMPLETE (MODIFIED) ===';
  raise notice 'Consolidated:';
  raise notice '  - institution_settings → institutions';
  raise notice '  - reconciliation_items → reconciliation_sessions.items (JSONB)';
  raise notice '  - SKIPPED: group_members (required for group leaders feature)';
  raise notice '';
  raise notice 'Deleted:';
  raise notice '  - branches';
  raise notice '  - loans';
  raise notice '  - meetings';
  raise notice '  - payers (if existed)';
  raise notice '';
  raise notice 'Preserved:';
  raise notice '  - group_members (required for group leaders feature)';
end $$;
