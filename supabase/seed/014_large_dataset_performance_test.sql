-- ============================================================================
-- Large Dataset Performance Test Data
-- Date: 2026-01-14
-- Purpose: Generate 1000+ records for performance testing
-- WARNING: This generates large amounts of data - only run in test environments
-- ============================================================================

-- ============================================================================
-- STEP 1: Ensure we have at least one institution
-- ============================================================================

DO $$
DECLARE
  test_institution_id UUID;
BEGIN
  -- Get or create a test institution
  SELECT id INTO test_institution_id
  FROM institutions
  WHERE code = 'PERF_TEST'
  LIMIT 1;

  IF test_institution_id IS NULL THEN
    INSERT INTO institutions (id, name, type, status, code, supervisor, created_at)
    VALUES (
      '00000000-0000-0000-0000-000000000001'::uuid,
      'Performance Test Institution',
      'SACCO',
      'ACTIVE',
      'PERF_TEST',
      'Test Supervisor',
      NOW()
    )
    RETURNING id INTO test_institution_id;
  END IF;

  -- ============================================================================
  -- STEP 2: Generate 1000+ Groups
  -- ============================================================================
  
  INSERT INTO groups (
    id, institution_id, group_name, status, expected_amount, 
    frequency, currency, meeting_day, cycle_label, fund_balance, 
    active_loans_count, created_at
  )
  SELECT 
    gen_random_uuid(),
    test_institution_id,
    'Performance Test Group ' || LPAD(generate_series::text, 4, '0'),
    CASE (generate_series % 10)
      WHEN 0 THEN 'PAUSED'
      WHEN 1 THEN 'CLOSED'
      ELSE 'ACTIVE'
    END,
    5000 + (random() * 100000)::numeric,
    CASE (generate_series % 2)
      WHEN 0 THEN 'Weekly'
      ELSE 'Monthly'
    END,
    'RWF',
    (ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])[1 + (generate_series % 7)],
    'Cycle ' || EXTRACT(YEAR FROM NOW()),
    (random() * 5000000)::numeric,
    (random() * 10)::int,
    NOW() - (random() * interval '365 days')
  FROM generate_series(1, 1000)
  ON CONFLICT DO NOTHING;

  -- ============================================================================
  -- STEP 3: Generate 1000+ Members
  -- ============================================================================
  
  INSERT INTO members (
    id, institution_id, full_name, phone, member_code, status, 
    savings_balance, loan_balance, token_balance, created_at
  )
  SELECT 
    gen_random_uuid(),
    test_institution_id,
    'Test Member ' || LPAD(generate_series::text, 4, '0'),
    '078' || LPAD((7000000 + generate_series)::text, 7, '0'),
    'MBR' || LPAD(generate_series::text, 4, '0'),
    CASE (generate_series % 20)
      WHEN 0 THEN 'PENDING'
      WHEN 1 THEN 'SUSPENDED'
      WHEN 2 THEN 'CLOSED'
      ELSE 'ACTIVE'
    END,
    (random() * 2000000)::numeric,
    (random() * 500000)::numeric,
    (random() * 10000)::numeric,
    NOW() - (random() * interval '730 days')
  FROM generate_series(1, 1000)
  ON CONFLICT DO NOTHING;

  -- ============================================================================
  -- STEP 4: Generate 10000+ Transactions
  -- ============================================================================
  
  INSERT INTO transactions (
    id, institution_id, member_id, group_id, occurred_at, amount, 
    currency, type, channel, status, allocation_status, 
    payer_phone, payer_name, momo_ref, reference, created_at
  )
  SELECT 
    gen_random_uuid(),
    test_institution_id,
    CASE 
      WHEN (generate_series % 3) = 0 THEN NULL
      ELSE (SELECT id FROM members WHERE institution_id = test_institution_id ORDER BY random() LIMIT 1)
    END,
    CASE 
      WHEN (generate_series % 4) = 0 THEN NULL
      ELSE (SELECT id FROM groups WHERE institution_id = test_institution_id ORDER BY random() LIMIT 1)
    END,
    NOW() - (random() * interval '180 days') - (random() * interval '1 hour'),
    1000 + (random() * 500000)::numeric,
    'RWF',
    CASE (generate_series % 5)
      WHEN 0 THEN 'CONTRIBUTION'
      WHEN 1 THEN 'LOAN_PAYMENT'
      WHEN 2 THEN 'LOAN_DISBURSEMENT'
      WHEN 3 THEN 'WITHDRAWAL'
      ELSE 'DEPOSIT'
    END,
    CASE (generate_series % 3)
      WHEN 0 THEN 'MOMO'
      WHEN 1 THEN 'BANK'
      ELSE 'CASH'
    END,
    CASE (generate_series % 10)
      WHEN 0 THEN 'PENDING'
      WHEN 1 THEN 'FAILED'
      WHEN 2 THEN 'REVERSED'
      ELSE 'COMPLETED'
    END,
    CASE (generate_series % 4)
      WHEN 0 THEN 'unallocated'
      WHEN 1 THEN 'allocated'
      WHEN 2 THEN 'flagged'
      ELSE 'allocated'
    END,
    '078' || LPAD((7000000 + (random() * 1000)::int)::text, 7, '0'),
    CASE WHEN random() > 0.3 THEN 'Payer ' || generate_series ELSE NULL END,
    'MP' || TO_CHAR(NOW() - (random() * interval '180 days'), 'YYMMDD') || '.' || 
    LPAD((random() * 9999)::int::text, 4, '0') || '.' || 
    CHR(65 + (random() * 25)::int) || LPAD(generate_series::text, 5, '0'),
    'REF' || LPAD(generate_series::text, 10, '0'),
    NOW() - (random() * interval '180 days')
  FROM generate_series(1, 10000)
  ON CONFLICT DO NOTHING;

  -- ============================================================================
  -- STEP 5: Generate Group Memberships (5000+ memberships)
  -- ============================================================================
  
  INSERT INTO group_members (
    id, institution_id, group_id, member_id, role, status, created_at
  )
  SELECT 
    gen_random_uuid(),
    test_institution_id,
    g.id,
    m.id,
    CASE (random() * 100)
      WHEN 0 THEN 'LEADER'
      WHEN 1 THEN 'CHAIRPERSON'
      WHEN 2 THEN 'SECRETARY'
      WHEN 3 THEN 'TREASURER'
      ELSE 'MEMBER'
    END,
    CASE (random() * 20)
      WHEN 0 THEN 'ARREARS'
      WHEN 1 THEN 'SUSPENDED'
      ELSE 'GOOD_STANDING'
    END,
    NOW() - (random() * interval '365 days')
  FROM groups g
  CROSS JOIN LATERAL (
    SELECT id FROM members 
    WHERE institution_id = test_institution_id 
    ORDER BY random() 
    LIMIT (5 + (random() * 25)::int)
  ) m
  WHERE NOT EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.group_id = g.id AND gm.member_id = m.id
  )
  LIMIT 5000;

  -- ============================================================================
  -- STEP 6: Generate SMS Messages (5000+ messages)
  -- ============================================================================
  
  INSERT INTO momo_sms_raw (
    id, institution_id, device_id, sender_phone, message_text, 
    ingested_at, processed_at, parsed_at, parse_status, created_at
  )
  SELECT 
    gen_random_uuid(),
    test_institution_id,
    (SELECT id FROM sms_gateway_devices WHERE institution_id = test_institution_id ORDER BY random() LIMIT 1),
    '078' || LPAD((7000000 + (random() * 1000)::int)::text, 7, '0'),
    'You have received ' || (1000 + (random() * 50000)::int) || ' RWF from ' || 
    '078' || LPAD((7000000 + (random() * 1000)::int)::text, 7, '0') || 
    '. Ref: MP' || TO_CHAR(NOW(), 'YYMMDD') || '.' || LPAD((random() * 9999)::int::text, 4, '0'),
    NOW() - (random() * interval '90 days'),
    CASE 
      WHEN (generate_series % 3) = 0 THEN NULL
      ELSE NOW() - (random() * interval '89 days')
    END,
    CASE 
      WHEN (generate_series % 2) = 0 THEN NULL
      ELSE NOW() - (random() * interval '88 days')
    END,
    CASE 
      WHEN (generate_series % 3) = 0 THEN 'pending'
      WHEN (generate_series % 3) = 1 THEN 'parsed'
      ELSE 'failed'
    END,
    NOW() - (random() * interval '90 days')
  FROM generate_series(1, 5000)
  ON CONFLICT DO NOTHING;

  -- ============================================================================
  -- STEP 7: Update table statistics for query planner
  -- ============================================================================
  
  ANALYZE groups;
  ANALYZE members;
  ANALYZE transactions;
  ANALYZE group_members;
  ANALYZE momo_sms_raw;

  -- ============================================================================
  -- STEP 8: Display summary
  -- ============================================================================
  
  RAISE NOTICE 'Large dataset generation complete!';
  RAISE NOTICE 'Institution ID: %', test_institution_id;
  
END $$;

-- Display counts
SELECT 
  'Institutions' as table_name, 
  COUNT(*) as count 
FROM institutions
WHERE code = 'PERF_TEST'
UNION ALL
SELECT 'Groups', COUNT(*) FROM groups WHERE institution_id = '00000000-0000-0000-0000-000000000001'::uuid
UNION ALL
SELECT 'Members', COUNT(*) FROM members WHERE institution_id = '00000000-0000-0000-0000-000000000001'::uuid
UNION ALL
SELECT 'Transactions', COUNT(*) FROM transactions WHERE institution_id = '00000000-0000-0000-0000-000000000001'::uuid
UNION ALL
SELECT 'Group Memberships', COUNT(*) FROM group_members WHERE institution_id = '00000000-0000-0000-0000-000000000001'::uuid
UNION ALL
SELECT 'SMS Messages', COUNT(*) FROM momo_sms_raw WHERE institution_id = '00000000-0000-0000-0000-000000000001'::uuid;
