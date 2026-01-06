-- Seed: Demo Members
-- Uses UPSERT pattern to avoid duplicates

DO $$
DECLARE
  inst_id uuid;
BEGIN
  -- Get first institution
  SELECT id INTO inst_id FROM institutions LIMIT 1;
  
  IF inst_id IS NULL THEN
    RAISE NOTICE 'No institutions found. Skipping member seed.';
    RETURN;
  END IF;

  -- Insert demo members
  INSERT INTO members (id, institution_id, full_name, phone, status, branch, kyc_status, savings_balance, loan_balance)
  VALUES
    ('22222222-0001-0001-0001-000000000001', inst_id, 'Jean-Paul Mugenzi', '+250788123001', 'ACTIVE', 'Kigali Main', 'VERIFIED', 150000, 0),
    ('22222222-0001-0001-0001-000000000002', inst_id, 'Marie Claire Uwimana', '+250788123002', 'ACTIVE', 'Kigali Main', 'VERIFIED', 280000, 500000),
    ('22222222-0001-0001-0001-000000000003', inst_id, 'Emmanuel Habimana', '+250788123003', 'ACTIVE', 'Musanze', 'VERIFIED', 95000, 0),
    ('22222222-0001-0001-0001-000000000004', inst_id, 'Diane Mukamana', '+250788123004', 'ACTIVE', 'Rubavu', 'PENDING', 45000, 0),
    ('22222222-0001-0001-0001-000000000005', inst_id, 'Patrick Ndayisaba', '+250788123005', 'ACTIVE', 'Kigali Main', 'VERIFIED', 520000, 1000000),
    ('22222222-0001-0001-0001-000000000006', inst_id, 'Grace Ingabire', '+250788123006', 'ACTIVE', 'Huye', 'VERIFIED', 125000, 0),
    ('22222222-0001-0001-0001-000000000007', inst_id, 'Claude Nzamurambaho', '+250788123007', 'ACTIVE', 'Musanze', 'VERIFIED', 75000, 250000),
    ('22222222-0001-0001-0001-000000000008', inst_id, 'Josiane Uwase', '+250788123008', 'SUSPENDED', 'Kigali Main', 'REJECTED', 0, 0),
    ('22222222-0001-0001-0001-000000000009', inst_id, 'Innocent Bizimana', '+250788123009', 'ACTIVE', 'Rubavu', 'PENDING', 30000, 0),
    ('22222222-0001-0001-0001-000000000010', inst_id, 'Yvonne Mukamurenzi', '+250788123010', 'ACTIVE', 'Huye', 'VERIFIED', 180000, 0)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    status = EXCLUDED.status,
    kyc_status = EXCLUDED.kyc_status,
    savings_balance = EXCLUDED.savings_balance,
    loan_balance = EXCLUDED.loan_balance;

  RAISE NOTICE 'Seeded 10 demo members for institution %', inst_id;
END $$;
