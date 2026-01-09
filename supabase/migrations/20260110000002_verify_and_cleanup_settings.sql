-- ============================================================================
-- VERIFY AND CLEANUP SETTINGS TABLES
-- Purpose: Check if settings table is redundant with institution_settings
-- Date: 2026-01-10
-- ============================================================================

-- ============================================================================
-- STEP 1: Check if settings table exists and has data
-- ============================================================================

do $$
declare
  v_settings_exists boolean;
  v_settings_count int;
  v_institution_settings_count int;
begin
  -- Check if settings table exists
  select exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' 
    and table_name = 'settings'
  ) into v_settings_exists;
  
  if v_settings_exists then
    -- Count records
    execute 'select count(*) from public.settings' into v_settings_count;
    select count(*) into v_institution_settings_count from public.institution_settings;
    
    raise notice '=== SETTINGS TABLE ANALYSIS ===';
    raise notice 'settings table exists: %', v_settings_exists;
    raise notice 'settings table record count: %', v_settings_count;
    raise notice 'institution_settings table record count: %', v_institution_settings_count;
    
    -- Check schema differences
    if v_settings_count > 0 then
      raise notice '';
      raise notice 'WARNING: settings table has data. Review schema before dropping.';
      raise notice 'Compare columns:';
      raise notice '  settings: institution_id, system_name, base_currency, ...';
      raise notice '  institution_settings: institution_id, parsing_mode, confidence_threshold, ...';
      raise notice '';
      raise notice 'If settings table contains different data, keep both tables.';
      raise notice 'If settings table is redundant, migrate data and drop it.';
    else
      raise notice '';
      raise notice 'settings table is empty. Safe to drop if redundant.';
    end if;
  else
    raise notice 'settings table does not exist. No action needed.';
  end if;
end $$;

-- ============================================================================
-- STEP 2: Compare schemas (for manual review)
-- ============================================================================

-- Uncomment to see schema comparison:
/*
SELECT 
  'settings' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'settings'
ORDER BY ordinal_position;

SELECT 
  'institution_settings' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'institution_settings'
ORDER BY ordinal_position;
*/

-- ============================================================================
-- STEP 3: Decision logic
-- ============================================================================

-- Based on schema review:
-- settings table: General institution settings
--   - system_name, base_currency, momo_shortcode, momo_merchant_id
--   - auto_reconcile, notifications_enabled
--
-- institution_settings table: Parsing-specific settings
--   - parsing_mode, confidence_threshold, dedupe_window_minutes
--   - low_confidence_alert_enabled, unallocated_alert_threshold
--
-- CONCLUSION: They serve DIFFERENT purposes → KEEP BOTH TABLES
--
-- No action needed - both tables are required for different configuration domains

/*
-- Only drop if empty and confirmed redundant
do $$
declare
  v_count int;
begin
  select count(*) into v_count from public.settings;
  
  if v_count = 0 then
    drop table if exists public.settings CASCADE;
    raise notice 'Dropped empty settings table';
  else
    raise notice 'settings table has % records. Review before dropping.', v_count;
  end if;
end $$;
*/
