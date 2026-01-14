-- ============================================================================
-- Master Seed Script (Idempotent)
-- Purpose: Create demo data for QA without duplicates
-- Usage: Run via run_seed.sh or directly in Supabase SQL editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Create demo institution (idempotent)
-- ============================================================================

INSERT INTO public.institutions (
  id,
  name,
  type,
  status,
  code,
  supervisor,
  total_assets
)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Demo SACCO',
  'SACCO',
  'ACTIVE',
  'DEMO001',
  'Demo Supervisor',
  1000000.00
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status;

-- ============================================================================
-- STEP 2: Create demo institution settings
-- ============================================================================

INSERT INTO public.settings (
  institution_id,
  system_name,
  support_email,
  base_currency,
  auto_reconcile,
  notifications_enabled
)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Demo SACCO Portal',
  'demo@example.com',
  'RWF',
  true,
  true
)
ON CONFLICT (institution_id) DO NOTHING;

-- ============================================================================
-- STEP 3: Create demo admin user profile
-- 
-- NOTE: This does NOT create auth.users entries - those must be created
-- via Supabase Auth (magic link, signup, etc.)
-- This just ensures if a user with this ID exists, they get admin role.
-- ============================================================================

-- Demo Admin Profile (linked to auth user with this ID if exists)
INSERT INTO public.profiles (
  user_id,
  institution_id,
  role,
  email,
  full_name,
  status
)
VALUES (
  'a0000000-0000-0000-0000-000000000010'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'ADMIN',
  'admin@demo.local',
  'Demo Admin',
  'ACTIVE'
)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'ADMIN',
  status = 'ACTIVE';

-- Demo Staff Profile
INSERT INTO public.profiles (
  user_id,
  institution_id,
  role,
  email,
  full_name,
  status
)
VALUES (
  'a0000000-0000-0000-0000-000000000011'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'STAFF',
  'staff@demo.local',
  'Demo Staff',
  'ACTIVE'
)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'STAFF',
  status = 'ACTIVE';

-- ============================================================================
-- STEP 4: Create demo groups
-- ============================================================================

INSERT INTO public.groups (
  id,
  institution_id,
  group_name,
  status,
  expected_amount,
  frequency,
  grace_days,
  currency
)
VALUES 
  (
    'b0000000-0000-0000-0000-000000000001'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'Weekly Savers',
    'ACTIVE',
    5000.00,
    'Weekly',
    7,
    'RWF'
  ),
  (
    'b0000000-0000-0000-0000-000000000002'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'Monthly Contributors',
    'ACTIVE',
    20000.00,
    'Monthly',
    14,
    'RWF'
  )
ON CONFLICT (id) DO UPDATE SET
  group_name = EXCLUDED.group_name,
  status = EXCLUDED.status;

-- ============================================================================
-- STEP 5: Create demo members
-- ============================================================================

INSERT INTO public.members (
  id,
  institution_id,
  full_name,
  phone,
  status,
  kyc_status,
  savings_balance
)
VALUES 
  (
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'Alice Uwimana',
    '+250780000001',
    'ACTIVE',
    'VERIFIED',
    50000.00
  ),
  (
    'c0000000-0000-0000-0000-000000000002'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'Bob Habimana',
    '+250780000002',
    'ACTIVE',
    'VERIFIED',
    75000.00
  ),
  (
    'c0000000-0000-0000-0000-000000000003'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'Claire Mukamana',
    '+250780000003',
    'ACTIVE',
    'PENDING',
    25000.00
  )
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  status = EXCLUDED.status;

-- ============================================================================
-- STEP 6: Create demo group memberships
-- ============================================================================

INSERT INTO public.group_members (
  id,
  institution_id,
  group_id,
  member_id,
  role,
  status
)
VALUES 
  (
    'd0000000-0000-0000-0000-000000000001'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'b0000000-0000-0000-0000-000000000001'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'CHAIRPERSON',
    'GOOD_STANDING'
  ),
  (
    'd0000000-0000-0000-0000-000000000002'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'b0000000-0000-0000-0000-000000000001'::uuid,
    'c0000000-0000-0000-0000-000000000002'::uuid,
    'MEMBER',
    'GOOD_STANDING'
  ),
  (
    'd0000000-0000-0000-0000-000000000003'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'b0000000-0000-0000-0000-000000000002'::uuid,
    'c0000000-0000-0000-0000-000000000003'::uuid,
    'TREASURER',
    'GOOD_STANDING'
  )
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- ============================================================================
-- STEP 7: Create demo transactions
-- ============================================================================

INSERT INTO public.transactions (
  id,
  institution_id,
  member_id,
  group_id,
  type,
  amount,
  currency,
  channel,
  status,
  reference
)
VALUES 
  (
    'e0000000-0000-0000-0000-000000000001'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'b0000000-0000-0000-0000-000000000001'::uuid,
    'CONTRIBUTION',
    5000.00,
    'RWF',
    'MOMO',
    'COMPLETED',
    'TXN-DEMO-001'
  ),
  (
    'e0000000-0000-0000-0000-000000000002'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'c0000000-0000-0000-0000-000000000002'::uuid,
    'b0000000-0000-0000-0000-000000000001'::uuid,
    'CONTRIBUTION',
    5000.00,
    'RWF',
    'MOMO',
    'COMPLETED',
    'TXN-DEMO-002'
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status;

-- ============================================================================
-- SEED COMPLETION SUMMARY
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '=== SEED COMPLETED SUCCESSFULLY ===';
  RAISE NOTICE 'Institution: Demo SACCO (a0000000-0000-0000-0000-000000000001)';
  RAISE NOTICE 'Admin user ID: a0000000-0000-0000-0000-000000000010';
  RAISE NOTICE 'Staff user ID: a0000000-0000-0000-0000-000000000011';
  RAISE NOTICE 'Groups: 2, Members: 3, Transactions: 2';
  RAISE NOTICE '===================================';
END $$;
