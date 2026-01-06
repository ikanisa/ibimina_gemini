-- Seed: Demo Groups
-- Uses UPSERT pattern to avoid duplicates

DO $$
DECLARE
  inst_id uuid;
BEGIN
  -- Get first institution
  SELECT id INTO inst_id FROM institutions LIMIT 1;
  
  IF inst_id IS NULL THEN
    RAISE NOTICE 'No institutions found. Skipping group seed.';
    RETURN;
  END IF;

  -- Insert demo groups
  INSERT INTO groups (id, institution_id, group_name, status, expected_amount, frequency, currency, meeting_day, cycle_label, fund_balance, active_loans_count)
  VALUES
    ('11111111-0001-0001-0001-000000000001', inst_id, 'Ibimina y''Urubyiruko', 'ACTIVE', 5000, 'Weekly', 'RWF', 'Friday', 'Cycle 2024', 2400000, 2),
    ('11111111-0001-0001-0001-000000000002', inst_id, 'Abahuje Vision', 'ACTIVE', 10000, 'Monthly', 'RWF', 'Monday', 'Season 5', 15600000, 5),
    ('11111111-0001-0001-0001-000000000003', inst_id, 'Tuzamurane Traders', 'PAUSED', 2000, 'Weekly', 'RWF', 'Sunday', 'Cycle 2023', 120000, 0)
  ON CONFLICT (id) DO UPDATE SET
    group_name = EXCLUDED.group_name,
    status = EXCLUDED.status,
    expected_amount = EXCLUDED.expected_amount,
    fund_balance = EXCLUDED.fund_balance,
    updated_at = now();

  RAISE NOTICE 'Seeded 3 demo groups for institution %', inst_id;
END $$;
