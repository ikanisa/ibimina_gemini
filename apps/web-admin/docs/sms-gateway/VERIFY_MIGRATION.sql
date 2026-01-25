-- ============================================================================
-- SMS Gateway Devices Migration Verification
-- Run this after applying the migration to verify everything was created correctly
-- ============================================================================

-- 1. Check tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('sms_gateway_devices', 'momo_sms_raw')
ORDER BY table_name;

-- Expected: 2 rows (sms_gateway_devices, momo_sms_raw)

-- 2. Check columns on sms_gateway_devices
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'sms_gateway_devices'
ORDER BY ordinal_position;

-- Expected: id, institution_id, device_name, momo_code, status, device_key_hash, 
--          last_sms_received_at, created_at, created_by

-- 3. Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename IN ('sms_gateway_devices', 'momo_sms_raw')
ORDER BY tablename, indexname;

-- Expected: Multiple indexes including unique constraint on momo_code

-- 4. Check trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name = 'trg_touch_device_last_sms';

-- Expected: 1 row with trigger on momo_sms_raw

-- 5. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('sms_gateway_devices', 'momo_sms_raw')
ORDER BY tablename, policyname;

-- Expected: read_devices_authenticated and read_sms_authenticated policies

-- 6. Check function exists
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'generate_device_key';

-- Expected: 1 row (function)

-- 7. Test constraint (should fail if momo_code is not unique)
-- This is just a check - don't actually insert
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'public.sms_gateway_devices'::regclass
  AND conname = 'sms_gateway_devices_unique_momo_code';

-- Expected: 1 row with constraint type 'u' (unique)

-- ============================================================================
-- If all checks pass, the migration was successful!
-- ============================================================================
