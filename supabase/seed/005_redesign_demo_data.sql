-- ============================================================================
-- Seed: Realistic Demo Data for Redesign
-- Requirements: 2 institutions, 3 staff, 10 groups, 100 members, 300 transactions, 40 unallocated
-- ============================================================================

-- Clean up existing demo data (optional - comment out if you want to keep existing)
-- DELETE FROM transactions WHERE institution_id IN (SELECT id FROM institutions WHERE name LIKE 'Demo%');
-- DELETE FROM members WHERE institution_id IN (SELECT id FROM institutions WHERE name LIKE 'Demo%');
-- DELETE FROM groups WHERE institution_id IN (SELECT id FROM institutions WHERE name LIKE 'Demo%');

-- ============================================================================
-- STEP 1: Create 2 demo institutions
-- ============================================================================

INSERT INTO public.institutions (id, name, type, status, code, supervisor, total_assets)
VALUES
  ('11111111-1111-1111-1111-000000000001', 'Demo SACCO Kigali', 'SACCO', 'ACTIVE', 'DEMO001', 'John Mukamana', 150000000),
  ('11111111-1111-1111-1111-000000000002', 'Demo SACCO Gisenyi', 'SACCO', 'ACTIVE', 'DEMO002', 'Marie Uwimana', 85000000)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code;

-- Add MoMo codes for institutions
INSERT INTO public.institution_momo_codes (institution_id, momo_code, is_active)
SELECT id, '182' || LPAD(SUBSTRING(code FROM 'DEMO(\d+)'), 3, '0'), true
FROM public.institutions
WHERE code LIKE 'DEMO%'
ON CONFLICT (institution_id, momo_code) DO NOTHING;

-- ============================================================================
-- STEP 2: Create 3 staff users (requires auth.users to exist)
-- ============================================================================
-- Note: These profiles will be created when auth users are created
-- For now, we'll reference user IDs that should exist
-- In production, create auth users first, then run this seed

-- Assume these auth.users exist:
-- - Platform Admin: user_id = '00000000-0000-0000-0000-000000000001'
-- - Staff 1 (SACCO Kigali): user_id = '00000000-0000-0000-0000-000000000002'
-- - Staff 2 (SACCO Gisenyi): user_id = '00000000-0000-0000-0000-000000000003'

-- Update profiles if they exist
UPDATE public.profiles
SET institution_id = '11111111-1111-1111-1111-000000000001',
    role = 'INSTITUTION_STAFF',
    full_name = 'Alice Nkurunziza',
    email = 'alice@demo1.sacco'
WHERE user_id = '00000000-0000-0000-0000-000000000002';

UPDATE public.profiles
SET institution_id = '11111111-1111-1111-1111-000000000002',
    role = 'INSTITUTION_STAFF',
    full_name = 'Bob Karangwa',
    email = 'bob@demo2.sacco'
WHERE user_id = '00000000-0000-0000-0000-000000000003';

-- ============================================================================
-- STEP 3: Create 10 groups (5 per institution)
-- ============================================================================

WITH inst_groups AS (
  SELECT 
    i.id as inst_id,
    i.code as inst_code,
    row_number() OVER (PARTITION BY i.id ORDER BY i.id) as rn
  FROM public.institutions i
  WHERE i.code LIKE 'DEMO%'
)
INSERT INTO public.groups (
  id, institution_id, group_name, status, expected_amount, frequency, 
  currency, meeting_day, cycle_label, fund_balance, active_loans_count
)
SELECT
  gen_random_uuid(),
  inst_id,
  CASE rn
    WHEN 1 THEN 'Ibimina y''Urubyiruko'
    WHEN 2 THEN 'Abahuje Vision'
    WHEN 3 THEN 'Tuzamurane Traders'
    WHEN 4 THEN 'Abanyarwanda Bafite Ubwoba'
    WHEN 5 THEN 'Turi Kumwe'
  END,
  'ACTIVE',
  CASE rn
    WHEN 1 THEN 5000
    WHEN 2 THEN 10000
    WHEN 3 THEN 2000
    WHEN 4 THEN 7500
    WHEN 5 THEN 3000
  END,
  CASE WHEN rn IN (1, 3, 5) THEN 'Weekly' ELSE 'Monthly' END,
  'RWF',
  CASE (rn % 7)
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END,
  'Cycle 2025',
  (CASE rn WHEN 1 THEN 5000 WHEN 2 THEN 10000 WHEN 3 THEN 2000 WHEN 4 THEN 7500 WHEN 5 THEN 3000 END) * 20 * (CASE WHEN rn IN (1, 3, 5) THEN 4 ELSE 1 END), -- Approximate fund balance
  FLOOR(RANDOM() * 5)::integer
FROM inst_groups
WHERE rn <= 5;

-- ============================================================================
-- STEP 4: Create 100 members (50 per institution, ~10 per group)
-- ============================================================================

DO $$
DECLARE
  inst_record RECORD;
  group_record RECORD;
  member_id uuid;
  member_num INTEGER := 0;
  first_names TEXT[] := ARRAY['Jean', 'Marie', 'Paul', 'Alice', 'Peter', 'Claire', 'Joseph', 'Sarah', 'David', 'Anne', 'Thomas', 'Grace', 'John', 'Joy', 'James'];
  last_names TEXT[] := ARRAY['Mukamana', 'Uwimana', 'Nkurunziza', 'Karangwa', 'Niyomugabo', 'Nyiramahoro', 'Habimana', 'Uwase', 'Ntaganda', 'Mutesi', 'Nshimiye', 'Mukamurenzi', 'Niyongabo', 'Mukanyangezi', 'Niyonsaba'];
  phone_prefix TEXT := '+250788';
  phone_num INTEGER;
BEGIN
  FOR inst_record IN SELECT id, code FROM public.institutions WHERE code LIKE 'DEMO%' ORDER BY code
  LOOP
    FOR group_record IN SELECT id FROM public.groups WHERE institution_id = inst_record.id ORDER BY group_name
    LOOP
      FOR i IN 1..10
      LOOP
        member_id := gen_random_uuid();
        member_num := member_num + 1;
        phone_num := 1000000 + (member_num * 17) % 9000000; -- Generate unique-ish phone numbers

        INSERT INTO public.members (
          id, institution_id, group_id, full_name, phone, status, kyc_status,
          savings_balance, loan_balance, token_balance, join_date
        ) VALUES (
          member_id,
          inst_record.id,
          group_record.id,
          first_names[1 + (member_num % array_length(first_names, 1))] || ' ' || 
          last_names[1 + ((member_num * 7) % array_length(last_names, 1))],
          phone_prefix || LPAD(phone_num::TEXT, 7, '0'),
          'ACTIVE',
          CASE WHEN member_num % 3 = 0 THEN 'VERIFIED' WHEN member_num % 3 = 1 THEN 'PENDING' ELSE 'PENDING' END,
          (1000 + (member_num * 137) % 50000)::numeric, -- Savings balance
          CASE WHEN member_num % 5 = 0 THEN (5000 + (member_num * 211) % 100000)::numeric ELSE 0 END, -- Some have loans
          0,
          CURRENT_DATE - ((member_num * 23) % 730) -- Join date within last 2 years
        );

        -- Add to group_members
        INSERT INTO public.group_members (
          institution_id, group_id, member_id, role, status, joined_date
        ) VALUES (
          inst_record.id,
          group_record.id,
          member_id,
          CASE WHEN i = 1 THEN 'CHAIRPERSON' WHEN i = 2 THEN 'SECRETARY' WHEN i = 3 THEN 'TREASURER' ELSE 'MEMBER' END,
          CASE WHEN member_num % 10 = 0 THEN 'IN_ARREARS' WHEN member_num % 20 = 0 THEN 'DEFAULTED' ELSE 'GOOD_STANDING' END,
          CURRENT_DATE - ((member_num * 23) % 730)
        );
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 5: Create 300 transactions (260 allocated, 40 unallocated)
-- ============================================================================

DO $$
DECLARE
  member_record RECORD;
  inst_record RECORD;
  txn_id uuid;
  txn_count INTEGER := 0;
  unallocated_count INTEGER := 0;
  sms_id uuid;
  occurred_date DATE;
  amount NUMERIC;
  payer_phone TEXT;
BEGIN
  -- Allocated transactions (260)
  FOR inst_record IN SELECT id FROM public.institutions WHERE code LIKE 'DEMO%'
  LOOP
    FOR member_record IN 
      SELECT m.id as member_id, m.group_id, m.phone, m.institution_id, g.group_name
      FROM public.members m
      JOIN public.groups g ON g.id = m.group_id
      WHERE m.institution_id = inst_record.id
      ORDER BY RANDOM()
      LIMIT 130
    LOOP
      FOR i IN 1..2 -- 2 transactions per member
      LOOP
        txn_count := txn_count + 1;
        txn_id := gen_random_uuid();
        sms_id := gen_random_uuid();
        occurred_date := CURRENT_DATE - ((txn_count * 37) % 90); -- Last 90 days
        amount := (1000 + (txn_count * 149) % 20000)::numeric;
        payer_phone := member_record.phone;

        -- Create SMS record
        INSERT INTO public.momo_sms_raw (
          id, institution_id, sender_phone, sms_text, received_at, source, hash, parse_status
        ) VALUES (
          sms_id,
          inst_record.id,
          payer_phone,
          'You have received ' || amount || ' RWF from ' || payer_phone || '. Ref: TXN' || txn_count,
          occurred_date + INTERVAL '1 hour' * (txn_count % 24),
          'android_gateway',
          encode(digest(sms_id::TEXT || occurred_date::TEXT, 'sha256'), 'hex'),
          'success'
        );

        -- Create allocated transaction
        INSERT INTO public.transactions (
          id, institution_id, momo_sms_id, member_id, group_id, type, amount, currency,
          channel, status, reference, occurred_at, payer_phone, momo_ref,
          parse_confidence, allocation_status, created_at
        ) VALUES (
          txn_id,
          inst_record.id,
          sms_id,
          member_record.member_id,
          member_record.group_id,
          'CONTRIBUTION',
          amount,
          'RWF',
          'MoMo',
          'COMPLETED',
          'TXN' || txn_count,
          occurred_date + INTERVAL '1 hour' * (txn_count % 24),
          payer_phone,
          'REF' || txn_count,
          0.95,
          'allocated',
          occurred_date + INTERVAL '1 hour' * (txn_count % 24)
        );

        -- Create allocation record
        INSERT INTO public.transaction_allocations (
          transaction_id, member_id, group_id, allocated_by
        ) VALUES (
          txn_id,
          member_record.member_id,
          member_record.group_id,
          '00000000-0000-0000-0000-000000000002' -- Staff user
        );
      END LOOP;
    END LOOP;

    -- Unallocated transactions (20 per institution = 40 total)
    FOR i IN 1..20
    LOOP
      unallocated_count := unallocated_count + 1;
      txn_id := gen_random_uuid();
      sms_id := gen_random_uuid();
      occurred_date := CURRENT_DATE - ((unallocated_count * 41) % 30); -- Last 30 days
      amount := (500 + (unallocated_count * 163) % 15000)::numeric;
      payer_phone := '+250788' || LPAD((9000000 + unallocated_count * 97)::TEXT, 7, '0');

      -- Create SMS record
      INSERT INTO public.momo_sms_raw (
        id, institution_id, sender_phone, sms_text, received_at, source, hash, parse_status
      ) VALUES (
        sms_id,
        inst_record.id,
        payer_phone,
        'You have received ' || amount || ' RWF from ' || payer_phone || '. Ref: UNALLOC' || unallocated_count,
        occurred_date + INTERVAL '1 hour' * (unallocated_count % 24),
        'android_gateway',
        encode(digest(sms_id::TEXT || occurred_date::TEXT || payer_phone, 'sha256'), 'hex'),
        'success'
      );

      -- Create unallocated transaction
      INSERT INTO public.transactions (
        id, institution_id, momo_sms_id, type, amount, currency,
        channel, status, reference, occurred_at, payer_phone, momo_ref,
        parse_confidence, allocation_status, created_at
      ) VALUES (
        txn_id,
        inst_record.id,
        sms_id,
        'CONTRIBUTION',
        amount,
        'RWF',
        'MoMo',
        'COMPLETED',
        'UNALLOC' || unallocated_count,
        occurred_date + INTERVAL '1 hour' * (unallocated_count % 24),
        payer_phone,
        'REF' || unallocated_count,
        0.90,
        'unallocated',
        occurred_date + INTERVAL '1 hour' * (unallocated_count % 24)
      );
    END LOOP;
  END LOOP;
END $$;

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
DECLARE
  inst_count INTEGER;
  group_count INTEGER;
  member_count INTEGER;
  txn_count INTEGER;
  unallocated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inst_count FROM public.institutions WHERE code LIKE 'DEMO%';
  SELECT COUNT(*) INTO group_count FROM public.groups WHERE institution_id IN (SELECT id FROM public.institutions WHERE code LIKE 'DEMO%');
  SELECT COUNT(*) INTO member_count FROM public.members WHERE institution_id IN (SELECT id FROM public.institutions WHERE code LIKE 'DEMO%');
  SELECT COUNT(*) INTO txn_count FROM public.transactions WHERE institution_id IN (SELECT id FROM public.institutions WHERE code LIKE 'DEMO%');
  SELECT COUNT(*) INTO unallocated_count FROM public.transactions WHERE institution_id IN (SELECT id FROM public.institutions WHERE code LIKE 'DEMO%') AND allocation_status = 'unallocated';

  RAISE NOTICE 'Seed complete:';
  RAISE NOTICE '  Institutions: %', inst_count;
  RAISE NOTICE '  Groups: %', group_count;
  RAISE NOTICE '  Members: %', member_count;
  RAISE NOTICE '  Transactions: %', txn_count;
  RAISE NOTICE '  Unallocated: %', unallocated_count;
END $$;

