-- Seed: Demo SMS Messages
-- Uses UPSERT pattern to avoid duplicates

DO $$
DECLARE
  inst_id uuid;
BEGIN
  -- Get first institution
  SELECT id INTO inst_id FROM institutions LIMIT 1;
  
  IF inst_id IS NULL THEN
    RAISE NOTICE 'No institutions found. Skipping SMS seed.';
    RETURN;
  END IF;

  -- Insert demo SMS messages
  INSERT INTO sms_messages (id, institution_id, sender, timestamp, body, is_parsed, parsed_amount, parsed_currency, parsed_transaction_id, parsed_counterparty)
  VALUES
    ('33333333-0001-0001-0001-000000000001', inst_id, 'MoMo', NOW() - INTERVAL '1 hour', 
     'You have received 5,000 RWF from JEAN-PAUL M. Ref: TXN-001', 
     true, 5000, 'RWF', 'TXN-001', 'JEAN-PAUL M'),
    ('33333333-0001-0001-0001-000000000002', inst_id, 'MoMo', NOW() - INTERVAL '2 hours', 
     'You have received 50,000 RWF from MARIE C. Ref: TXN-002', 
     true, 50000, 'RWF', 'TXN-002', 'MARIE C'),
    ('33333333-0001-0001-0001-000000000003', inst_id, 'MoMo', NOW() - INTERVAL '3 hours', 
     'Payment of 25,000 RWF to LOAN-001 successful. Balance: 475,000 RWF', 
     true, 25000, 'RWF', 'TXN-003', 'LOAN-001'),
    ('33333333-0001-0001-0001-000000000004', inst_id, 'MoMo', NOW() - INTERVAL '4 hours', 
     'You have received 5,000 RWF from unknown sender', 
     false, NULL, NULL, NULL, NULL),
    ('33333333-0001-0001-0001-000000000005', inst_id, 'MTN', NOW() - INTERVAL '5 hours', 
     'Your MoMo balance is 1,250,000 RWF', 
     false, NULL, NULL, NULL, NULL),
    ('33333333-0001-0001-0001-000000000006', inst_id, 'MoMo', NOW() - INTERVAL '1 day', 
     'You have received 10,000 RWF from EMMANUEL H. Ref: TXN-006', 
     true, 10000, 'RWF', 'TXN-006', 'EMMANUEL H'),
    ('33333333-0001-0001-0001-000000000007', inst_id, 'MoMo', NOW() - INTERVAL '2 days', 
     'Transaction failed. Insufficient balance.', 
     false, NULL, NULL, NULL, NULL),
    ('33333333-0001-0001-0001-000000000008', inst_id, 'MoMo', NOW() - INTERVAL '3 days', 
     'You have received 100,000 RWF from PATRICK N. Ref: TXN-008', 
     true, 100000, 'RWF', 'TXN-008', 'PATRICK N'),
    ('33333333-0001-0001-0001-000000000009', inst_id, 'MoMo', NOW() - INTERVAL '5 days', 
     'You have received 75,000 RWF from GRACE I. Ref: TXN-009', 
     true, 75000, 'RWF', 'TXN-009', 'GRACE I'),
    ('33333333-0001-0001-0001-000000000010', inst_id, 'Bank', NOW() - INTERVAL '7 days', 
     'Bank transfer of 500,000 RWF completed. Ref: TXN-010', 
     true, 500000, 'RWF', 'TXN-010', 'BANK TRANSFER')
  ON CONFLICT (id) DO UPDATE SET
    body = EXCLUDED.body,
    is_parsed = EXCLUDED.is_parsed,
    parsed_amount = EXCLUDED.parsed_amount,
    parsed_currency = EXCLUDED.parsed_currency,
    parsed_transaction_id = EXCLUDED.parsed_transaction_id,
    parsed_counterparty = EXCLUDED.parsed_counterparty;

  RAISE NOTICE 'Seeded 10 demo SMS messages for institution %', inst_id;
END $$;
