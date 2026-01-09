-- ============================================================================
-- DELETE UNUSED VIEWS AND TABLES
-- Purpose: Remove unused reporting views and fcm_tokens table
-- ============================================================================

-- Delete unused views (if not used in Reports component)
drop view if exists public.vw_duplicate_candidates CASCADE;
drop view if exists public.vw_group_totals_daily CASCADE;
drop view if exists public.vw_institution_totals_daily CASCADE;
drop view if exists public.vw_member_totals_daily CASCADE;

-- Delete unused fcm_tokens table (empty, not used in codebase)
drop table if exists public.fcm_tokens CASCADE;

-- Verification
do $$
declare
  view_count int;
  table_count int;
begin
  select count(*) into view_count
  from information_schema.views 
  where table_schema = 'public' 
    and table_name IN ('vw_duplicate_candidates', 'vw_group_totals_daily', 'vw_institution_totals_daily', 'vw_member_totals_daily');
  
  select count(*) into table_count
  from information_schema.tables 
  where table_schema = 'public' 
    and table_name = 'fcm_tokens';
  
  if view_count = 0 and table_count = 0 then
    raise notice 'SUCCESS: All unused views and fcm_tokens table deleted';
  else
    raise notice 'WARNING: % views and % tables still exist', view_count, table_count;
  end if;
end $$;
