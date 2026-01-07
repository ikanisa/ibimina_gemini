-- ============================================================================
-- Seed: Reconciliation Demo Data
-- Purpose: Add unallocated transactions, parse errors, and duplicate candidates
-- ============================================================================

-- Get first institution ID
DO $$
DECLARE
  v_institution_id uuid;
  v_member_id uuid;
  v_group_id uuid;
  v_base_time timestamptz := now() - interval '3 days';
  i int;
BEGIN
  -- Get first institution
  SELECT id INTO v_institution_id
  FROM public.institutions
  LIMIT 1;

  IF v_institution_id IS NULL THEN
    RAISE NOTICE 'No institutions found, skipping seed';
    RETURN;
  END IF;

  -- Get a member and group for context
  SELECT id, group_id INTO v_member_id, v_group_id
  FROM public.members
  WHERE institution_id = v_institution_id
  LIMIT 1;

  RAISE NOTICE 'Seeding reconciliation data for institution: %', v_institution_id;

  -- ============================================================================
  -- 1. Add more unallocated transactions (at least 40)
  -- ============================================================================
  FOR i IN 1..45 LOOP
    INSERT INTO public.transactions (
      institution_id,
      amount,
      currency,
      payer_phone,
      payer_name,
      momo_ref,
      momo_tx_id,
      occurred_at,
      allocation_status,
      parse_confidence,
      created_at
    ) VALUES (
      v_institution_id,
      (1000 + (random() * 50000))::int,
      'RWF',
      '0788' || lpad((random() * 999999)::int::text, 6, '0'),
      'Payer ' || i,
      'REF' || lpad(i::text, 6, '0') || 'UNALLOC',
      'TXN' || lpad(i::text, 8, '0') || 'UA',
      v_base_time + (i * interval '1 hour'),
      'unallocated',
      0.85 + (random() * 0.15),
      now()
    ) ON CONFLICT DO NOTHING;
  END LOOP;

  -- Add some aging unallocated transactions (> 24h old)
  FOR i IN 1..10 LOOP
    INSERT INTO public.transactions (
      institution_id,
      amount,
      currency,
      payer_phone,
      payer_name,
      momo_ref,
      momo_tx_id,
      occurred_at,
      allocation_status,
      parse_confidence,
      created_at
    ) VALUES (
      v_institution_id,
      (5000 + (random() * 30000))::int,
      'RWF',
      '0788' || lpad((random() * 999999)::int::text, 6, '0'),
      'Old Payer ' || i,
      'OLDREF' || lpad(i::text, 4, '0'),
      'OLDTXN' || lpad(i::text, 6, '0'),
      now() - interval '48 hours' - (i * interval '2 hours'),
      'unallocated',
      0.7 + (random() * 0.3),
      now() - interval '48 hours'
    ) ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Added 55 unallocated transactions';

  -- ============================================================================
  -- 2. Add parse errors (at least 10)
  -- ============================================================================
  FOR i IN 1..15 LOOP
    INSERT INTO public.momo_sms_raw (
      institution_id,
      sender_phone,
      sms_text,
      source,
      hash,
      received_at,
      parse_status,
      parse_error,
      resolution_status
    ) VALUES (
      v_institution_id,
      '0788' || lpad((random() * 999999)::int::text, 6, '0'),
      CASE (i % 5)
        WHEN 0 THEN 'You have received a call from ' || (random() * 999999)::int::text
        WHEN 1 THEN 'Balance: ' || (random() * 100000)::int::text || ' RWF. Dial *182# for more.'
        WHEN 2 THEN 'Your account has been credited with X amount'
        WHEN 3 THEN 'Transaction failed. Please try again later.'
        ELSE 'Garbled message with no clear amount or ref #$%^&'
      END,
      'api_push',
      md5(random()::text || clock_timestamp()::text),
      now() - (i * interval '2 hours'),
      'error',
      CASE (i % 3)
        WHEN 0 THEN 'No amount found in SMS'
        WHEN 1 THEN 'Unable to determine transaction type'
        ELSE 'Invalid SMS format - not a payment notification'
      END,
      'open'
    ) ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Added 15 parse errors';

  -- ============================================================================
  -- 3. Add duplicate candidates (at least 5 groups)
  -- ============================================================================

  -- Create duplicate transactions by momo_tx_id (3 groups)
  FOR i IN 1..3 LOOP
    -- First transaction (will be canonical)
    INSERT INTO public.transactions (
      institution_id,
      amount,
      currency,
      payer_phone,
      payer_name,
      momo_ref,
      momo_tx_id,
      occurred_at,
      allocation_status,
      parse_confidence,
      created_at
    ) VALUES (
      v_institution_id,
      20000 + (i * 5000),
      'RWF',
      '0788100' || lpad(i::text, 3, '0'),
      'Duplicate Payer ' || i,
      'DUPEREF' || i,
      'DUPETXN' || lpad(i::text, 4, '0'),  -- Same tx_id will create duplicate
      v_base_time + (i * interval '30 minutes'),
      'unallocated',
      0.95,
      now()
    ) ON CONFLICT DO NOTHING;

    -- Second transaction (duplicate of first)
    INSERT INTO public.transactions (
      institution_id,
      amount,
      currency,
      payer_phone,
      payer_name,
      momo_ref,
      momo_tx_id,
      occurred_at,
      allocation_status,
      parse_confidence,
      created_at
    ) VALUES (
      v_institution_id,
      20000 + (i * 5000),
      'RWF',
      '0788100' || lpad(i::text, 3, '0'),
      'Duplicate Payer ' || i,
      'DUPEREF' || i || 'B',
      'DUPETXN' || lpad(i::text, 4, '0'),  -- Same tx_id
      v_base_time + (i * interval '30 minutes') + interval '5 minutes',
      'unallocated',
      0.90,
      now()
    ) ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Added 3 duplicate groups by momo_tx_id';

  -- Create fingerprint duplicates (same amount + phone + time window)
  FOR i IN 1..3 LOOP
    -- First transaction
    INSERT INTO public.transactions (
      institution_id,
      amount,
      currency,
      payer_phone,
      payer_name,
      momo_ref,
      occurred_at,
      allocation_status,
      parse_confidence,
      created_at
    ) VALUES (
      v_institution_id,
      15000 + (i * 2500),
      'RWF',
      '0788200' || lpad(i::text, 3, '0'),  -- Same phone
      'Fingerprint Payer ' || i,
      'FPREF' || i || 'A',
      v_base_time + (i * interval '1 hour'),
      'unallocated',
      0.88,
      now()
    ) ON CONFLICT DO NOTHING;

    -- Second transaction (fingerprint duplicate - same amount, phone, within time window)
    INSERT INTO public.transactions (
      institution_id,
      amount,
      currency,
      payer_phone,
      payer_name,
      momo_ref,
      occurred_at,
      allocation_status,
      parse_confidence,
      created_at
    ) VALUES (
      v_institution_id,
      15000 + (i * 2500),  -- Same amount
      'RWF',
      '0788200' || lpad(i::text, 3, '0'),  -- Same phone
      'Fingerprint Payer ' || i,
      'FPREF' || i || 'B',
      v_base_time + (i * interval '1 hour') + interval '15 minutes',  -- Within dedupe window
      'unallocated',
      0.85,
      now()
    ) ON CONFLICT DO NOTHING;

    -- Third transaction (another duplicate in same group)
    INSERT INTO public.transactions (
      institution_id,
      amount,
      currency,
      payer_phone,
      payer_name,
      momo_ref,
      occurred_at,
      allocation_status,
      parse_confidence,
      created_at
    ) VALUES (
      v_institution_id,
      15000 + (i * 2500),  -- Same amount
      'RWF',
      '0788200' || lpad(i::text, 3, '0'),  -- Same phone
      'Fingerprint Payer ' || i || ' (retry)',
      'FPREF' || i || 'C',
      v_base_time + (i * interval '1 hour') + interval '30 minutes',  -- Within dedupe window
      'unallocated',
      0.82,
      now()
    ) ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Added 3 fingerprint duplicate groups';

  RAISE NOTICE 'Reconciliation demo data seeding complete!';

END $$;

-- ============================================================================
-- Summary of seeded data:
-- - 55 unallocated transactions (45 recent + 10 aging > 24h)
-- - 15 parse errors (open, unresolved)
-- - 6 duplicate groups (3 by momo_tx_id, 3 by fingerprint)
-- ============================================================================

