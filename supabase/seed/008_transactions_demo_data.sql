-- ============================================================================
-- TRANSACTIONS DEMO DATA
-- ============================================================================
-- This seed file creates 300 transactions with a mix of:
-- - 260 allocated transactions
-- - 40 unallocated transactions (for allocation queue)
-- - A few flagged/duplicate examples
-- ============================================================================

-- Note: This assumes groups and members from 007_dashboard_demo_data.sql exist
-- Institution 1: 11111111-1111-1111-1111-111111111111
-- Institution 2: 22222222-2222-2222-2222-222222222222

-- ============================================================================
-- Generate 300 transactions using generate_series
-- ============================================================================

-- First, let's create more members if needed
INSERT INTO public.members (id, institution_id, group_id, full_name, phone, member_code, status, created_at)
SELECT
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  (ARRAY['gggg0001-0001-0001-0001-000000000001'::uuid, 'gggg0002-0002-0002-0002-000000000002'::uuid])[1 + (i % 2)],
  'Member ' || (i + 100),
  '+25078800' || lpad((i + 100)::text, 4, '0'),
  'MBR' || lpad((i + 100)::text, 4, '0'),
  'ACTIVE',
  NOW() - (i || ' days')::interval
FROM generate_series(1, 20) i
ON CONFLICT DO NOTHING;

-- Now create 300 transactions with varied data
WITH transaction_data AS (
  SELECT
    gen_random_uuid() as id,
    '11111111-1111-1111-1111-111111111111'::uuid as institution_id,
    -- Assign member only for allocated transactions (first 260)
    CASE 
      WHEN i <= 260 THEN (
        SELECT id FROM public.members 
        WHERE institution_id = '11111111-1111-1111-1111-111111111111' 
        ORDER BY random() 
        LIMIT 1
      )
      ELSE NULL
    END as member_id,
    -- Amount varies from 5000 to 500000
    (5000 + (random() * 495000)::int)::numeric as amount,
    'RWF' as currency,
    -- Date within last 30 days
    NOW() - ((random() * 30)::int || ' days')::interval - ((random() * 24)::int || ' hours')::interval as occurred_at,
    -- Payer phone
    '+25078' || (7000000 + (random() * 2999999)::int)::text as payer_phone,
    -- Payer name (some null)
    CASE WHEN random() > 0.3 THEN 'Payer ' || i ELSE NULL END as payer_name,
    -- MoMo ref
    'MP' || to_char(NOW() - ((random() * 30)::int || ' days')::interval, 'YYMMDD') || '.' || 
    lpad((random() * 9999)::int::text, 4, '0') || '.' || 
    chr(65 + (random() * 25)::int) || lpad(i::text, 5, '0') as momo_ref,
    -- Parse confidence
    (0.75 + random() * 0.25)::numeric(3,2) as parse_confidence,
    -- Allocation status
    CASE 
      WHEN i <= 260 THEN 'allocated'
      WHEN i <= 295 THEN 'unallocated'
      WHEN i <= 298 THEN 'flagged'
      ELSE 'duplicate'
    END as allocation_status,
    'CONTRIBUTION' as type,
    'MoMo' as channel,
    'COMPLETED' as status,
    i
  FROM generate_series(1, 300) i
)
INSERT INTO public.transactions (
  id, institution_id, member_id, group_id, amount, currency, occurred_at,
  payer_phone, payer_name, momo_ref, parse_confidence, allocation_status,
  type, channel, status, created_at
)
SELECT
  td.id,
  td.institution_id,
  td.member_id,
  -- Get group_id from member
  CASE WHEN td.member_id IS NOT NULL THEN (
    SELECT group_id FROM public.members WHERE id = td.member_id
  ) ELSE NULL END,
  td.amount,
  td.currency,
  td.occurred_at,
  td.payer_phone,
  td.payer_name,
  td.momo_ref,
  td.parse_confidence,
  td.allocation_status,
  td.type,
  td.channel,
  td.status,
  td.occurred_at
FROM transaction_data td
ON CONFLICT DO NOTHING;

-- Add some transactions for institution 2
WITH transaction_data_2 AS (
  SELECT
    gen_random_uuid() as id,
    '22222222-2222-2222-2222-222222222222'::uuid as institution_id,
    CASE 
      WHEN i <= 40 THEN 'mmmm0004-0004-0004-0004-000000000004'::uuid
      ELSE NULL
    END as member_id,
    (10000 + (random() * 290000)::int)::numeric as amount,
    'RWF' as currency,
    NOW() - ((random() * 30)::int || ' days')::interval as occurred_at,
    '+25078' || (8000000 + (random() * 1999999)::int)::text as payer_phone,
    'Payer Inst2 ' || i as payer_name,
    'MP2' || to_char(NOW(), 'YYMMDD') || '.' || lpad(i::text, 5, '0') as momo_ref,
    (0.80 + random() * 0.20)::numeric(3,2) as parse_confidence,
    CASE WHEN i <= 40 THEN 'allocated' ELSE 'unallocated' END as allocation_status,
    i
  FROM generate_series(1, 50) i
)
INSERT INTO public.transactions (
  id, institution_id, member_id, group_id, amount, currency, occurred_at,
  payer_phone, payer_name, momo_ref, parse_confidence, allocation_status,
  type, channel, status, created_at
)
SELECT
  td.id,
  td.institution_id,
  td.member_id,
  CASE WHEN td.member_id IS NOT NULL THEN 'gggg0003-0003-0003-0003-000000000003'::uuid ELSE NULL END,
  td.amount,
  td.currency,
  td.occurred_at,
  td.payer_phone,
  td.payer_name,
  td.momo_ref,
  td.parse_confidence,
  td.allocation_status,
  'CONTRIBUTION',
  'MoMo',
  'COMPLETED',
  td.occurred_at
FROM transaction_data_2 td
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Summary
-- ============================================================================
-- This seed creates:
-- - 20 additional members for institution 1
-- - 300 transactions for institution 1 (260 allocated, 35 unallocated, 3 flagged, 2 duplicate)
-- - 50 transactions for institution 2 (40 allocated, 10 unallocated)
-- Total: 350 transactions across both institutions
-- ============================================================================

