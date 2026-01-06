-- Seed demo data for development and testing
-- Links to first 3 institutions in the database

-- Get 3 institution IDs to use for demo data
DO $$
DECLARE
  inst1_id uuid;
  inst2_id uuid;
  inst3_id uuid;
  member1_id uuid;
  member2_id uuid;
  member3_id uuid;
  member4_id uuid;
  member5_id uuid;
  group1_id uuid;
  group2_id uuid;
  group3_id uuid;
BEGIN
  -- Get first 3 institutions
  SELECT id INTO inst1_id FROM institutions ORDER BY created_at LIMIT 1;
  SELECT id INTO inst2_id FROM institutions ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO inst3_id FROM institutions ORDER BY created_at LIMIT 1 OFFSET 2;
  
  -- If no institutions exist, exit
  IF inst1_id IS NULL THEN
    RAISE NOTICE 'No institutions found. Skipping seed data.';
    RETURN;
  END IF;
  
  -- Use first institution for all demo data if only one exists
  inst2_id := COALESCE(inst2_id, inst1_id);
  inst3_id := COALESCE(inst3_id, inst1_id);

  -- ============================================
  -- MEMBERS (10 demo members)
  -- ============================================
  INSERT INTO members (id, institution_id, full_name, phone, status, kyc_status, savings_balance, loan_balance, token_balance, branch, join_date)
  VALUES 
    (gen_random_uuid(), inst1_id, 'Jean-Paul Mugenzi', '+250788123456', 'ACTIVE', 'VERIFIED', 150000, 0, 12.50, 'Kigali Main', '2023-01-15'),
    (gen_random_uuid(), inst1_id, 'Grace Uwimana', '+250788234567', 'ACTIVE', 'VERIFIED', 280000, 50000, 25.00, 'Kigali Main', '2023-02-20'),
    (gen_random_uuid(), inst1_id, 'Eric Ndayisaba', '+250788345678', 'ACTIVE', 'PENDING', 45000, 0, 0, 'Musanze Branch', '2023-03-10'),
    (gen_random_uuid(), inst2_id, 'Divine Keza', '+250788456789', 'ACTIVE', 'VERIFIED', 320000, 100000, 50.00, 'HQ', '2022-11-01'),
    (gen_random_uuid(), inst2_id, 'Patrick Habimana', '+250788567890', 'SUSPENDED', 'REJECTED', 0, 250000, 0, 'HQ', '2022-06-15'),
    (gen_random_uuid(), inst2_id, 'Claudine Mukamana', '+250788678901', 'ACTIVE', 'VERIFIED', 890000, 0, 100.00, 'Rural Branch', '2021-08-20'),
    (gen_random_uuid(), inst3_id, 'Emmanuel Nshimiyimana', '+250788789012', 'ACTIVE', 'VERIFIED', 156000, 75000, 15.00, 'Main', '2023-04-05'),
    (gen_random_uuid(), inst3_id, 'Jeanne Uwera', '+250788890123', 'ACTIVE', 'VERIFIED', 420000, 0, 40.00, 'Main', '2022-12-01'),
    (gen_random_uuid(), inst3_id, 'Bosco Niyonzima', '+250788901234', 'ACTIVE', 'PENDING', 78000, 30000, 5.00, 'Branch 2', '2023-05-15'),
    (gen_random_uuid(), inst1_id, 'Alice Mutoni', '+250789012345', 'ACTIVE', 'VERIFIED', 560000, 0, 75.00, 'Kigali Main', '2022-09-10')
  ON CONFLICT DO NOTHING;

  -- Get member IDs for linking
  SELECT id INTO member1_id FROM members WHERE phone = '+250788123456' LIMIT 1;
  SELECT id INTO member2_id FROM members WHERE phone = '+250788234567' LIMIT 1;
  SELECT id INTO member3_id FROM members WHERE phone = '+250788345678' LIMIT 1;
  SELECT id INTO member4_id FROM members WHERE phone = '+250788456789' LIMIT 1;
  SELECT id INTO member5_id FROM members WHERE phone = '+250788567890' LIMIT 1;

  -- ============================================
  -- GROUPS (3 demo groups)
  -- ============================================
  INSERT INTO groups (id, institution_id, group_name, status, expected_amount, frequency, meeting_day, fund_balance, active_loans_count, cycle_label, next_meeting_date)
  VALUES 
    (gen_random_uuid(), inst1_id, 'Ibimina y''Urubyiruko', 'ACTIVE', 5000, 'Weekly', 'Friday', 2400000, 2, 'Cycle 2024', CURRENT_DATE + 7),
    (gen_random_uuid(), inst2_id, 'Abahuje Vision Traders', 'ACTIVE', 10000, 'Monthly', 'Monday', 15600000, 5, 'Season 5', CURRENT_DATE + 14),
    (gen_random_uuid(), inst3_id, 'Tuzamurane Farmers', 'PAUSED', 2000, 'Weekly', 'Sunday', 120000, 0, 'Cycle 2024', NULL)
  ON CONFLICT DO NOTHING;

  -- Get group IDs
  SELECT id INTO group1_id FROM groups WHERE group_name = 'Ibimina y''Urubyiruko' LIMIT 1;
  SELECT id INTO group2_id FROM groups WHERE group_name = 'Abahuje Vision Traders' LIMIT 1;
  SELECT id INTO group3_id FROM groups WHERE group_name = 'Tuzamurane Farmers' LIMIT 1;

  -- ============================================
  -- GROUP MEMBERS (link members to groups)
  -- ============================================
  IF member1_id IS NOT NULL AND group1_id IS NOT NULL THEN
    INSERT INTO group_members (institution_id, group_id, member_id, role, status, joined_date)
    VALUES 
      (inst1_id, group1_id, member1_id, 'CHAIRPERSON', 'GOOD_STANDING', '2023-01-15'),
      (inst1_id, group1_id, member2_id, 'TREASURER', 'GOOD_STANDING', '2023-02-20'),
      (inst1_id, group1_id, member3_id, 'MEMBER', 'IN_ARREARS', '2023-03-10')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- LOANS (5 demo loans)
  -- ============================================
  INSERT INTO loans (institution_id, member_id, group_id, amount, outstanding_balance, status, start_date, next_payment_date, interest_rate, term_months)
  VALUES 
    (inst1_id, member1_id, group1_id, 500000, 450000, 'ACTIVE', CURRENT_DATE - 30, CURRENT_DATE + 15, 12.5, 12),
    (inst1_id, member2_id, group1_id, 200000, 180000, 'ACTIVE', CURRENT_DATE - 60, CURRENT_DATE + 5, 10.0, 6),
    (inst2_id, member4_id, group2_id, 1000000, 750000, 'ACTIVE', CURRENT_DATE - 90, CURRENT_DATE + 20, 15.0, 24),
    (inst2_id, member5_id, NULL, 300000, 300000, 'OVERDUE', CURRENT_DATE - 120, CURRENT_DATE - 30, 18.0, 12),
    (inst3_id, member1_id, NULL, 150000, 0, 'CLOSED', CURRENT_DATE - 180, NULL, 12.0, 6)
  ON CONFLICT DO NOTHING;

  -- ============================================
  -- TRANSACTIONS (20 demo transactions)
  -- ============================================
  INSERT INTO transactions (institution_id, member_id, group_id, type, amount, currency, channel, status, reference, created_at)
  VALUES 
    (inst1_id, member1_id, group1_id, 'CONTRIBUTION', 5000, 'RWF', 'MoMo', 'COMPLETED', 'TXN-001', NOW() - INTERVAL '1 day'),
    (inst1_id, member2_id, group1_id, 'CONTRIBUTION', 5000, 'RWF', 'Cash', 'COMPLETED', 'TXN-002', NOW() - INTERVAL '1 day'),
    (inst1_id, member1_id, NULL, 'DEPOSIT', 50000, 'RWF', 'MoMo', 'COMPLETED', 'TXN-003', NOW() - INTERVAL '2 days'),
    (inst1_id, member2_id, NULL, 'WITHDRAWAL', 20000, 'RWF', 'Bank', 'COMPLETED', 'TXN-004', NOW() - INTERVAL '3 days'),
    (inst1_id, member1_id, group1_id, 'LOAN_DISBURSEMENT', 500000, 'RWF', 'Bank', 'COMPLETED', 'TXN-005', NOW() - INTERVAL '30 days'),
    (inst1_id, member1_id, group1_id, 'LOAN_REPAYMENT', 50000, 'RWF', 'MoMo', 'COMPLETED', 'TXN-006', NOW() - INTERVAL '5 days'),
    (inst2_id, member4_id, group2_id, 'CONTRIBUTION', 10000, 'RWF', 'MoMo', 'COMPLETED', 'TXN-007', NOW() - INTERVAL '1 day'),
    (inst2_id, member4_id, NULL, 'DEPOSIT', 100000, 'RWF', 'Bank', 'COMPLETED', 'TXN-008', NOW() - INTERVAL '7 days'),
    (inst2_id, member4_id, group2_id, 'LOAN_DISBURSEMENT', 1000000, 'RWF', 'Bank', 'COMPLETED', 'TXN-009', NOW() - INTERVAL '90 days'),
    (inst2_id, member4_id, group2_id, 'LOAN_REPAYMENT', 250000, 'RWF', 'MoMo', 'COMPLETED', 'TXN-010', NOW() - INTERVAL '10 days'),
    (inst3_id, member1_id, NULL, 'TOKEN_PURCHASE', 12.50, 'USD', 'MoMo', 'COMPLETED', 'TXN-011', NOW() - INTERVAL '14 days'),
    (inst1_id, member2_id, NULL, 'TOKEN_PURCHASE', 25.00, 'USD', 'Bank', 'COMPLETED', 'TXN-012', NOW() - INTERVAL '21 days'),
    (inst1_id, member3_id, group1_id, 'CONTRIBUTION', 5000, 'RWF', 'Cash', 'PENDING', 'TXN-013', NOW() - INTERVAL '1 day'),
    (inst1_id, member1_id, NULL, 'WITHDRAWAL', 30000, 'RWF', 'MoMo', 'FAILED', 'TXN-014', NOW() - INTERVAL '2 days'),
    (inst2_id, member5_id, NULL, 'LOAN_REPAYMENT', 0, 'RWF', 'MoMo', 'FAILED', 'TXN-015', NOW() - INTERVAL '30 days'),
    (inst1_id, member1_id, group1_id, 'CONTRIBUTION', 5000, 'RWF', 'MoMo', 'COMPLETED', 'TXN-016', NOW() - INTERVAL '8 days'),
    (inst1_id, member2_id, group1_id, 'CONTRIBUTION', 5000, 'RWF', 'MoMo', 'COMPLETED', 'TXN-017', NOW() - INTERVAL '8 days'),
    (inst2_id, member4_id, group2_id, 'CONTRIBUTION', 10000, 'RWF', 'Cash', 'COMPLETED', 'TXN-018', NOW() - INTERVAL '30 days'),
    (inst3_id, member1_id, group3_id, 'CONTRIBUTION', 2000, 'RWF', 'Cash', 'COMPLETED', 'TXN-019', NOW() - INTERVAL '14 days'),
    (inst1_id, member2_id, NULL, 'DEPOSIT', 75000, 'RWF', 'MoMo', 'COMPLETED', 'TXN-020', NOW() - INTERVAL '5 days')
  ON CONFLICT DO NOTHING;

  -- ============================================
  -- SMS MESSAGES (15 demo SMS)
  -- ============================================
  INSERT INTO sms_messages (institution_id, sender, timestamp, body, is_parsed, parsed_amount, parsed_currency, parsed_transaction_id)
  VALUES 
    (inst1_id, 'MoMo', NOW() - INTERVAL '1 hour', 'You have received 5,000 RWF from JEAN-PAUL M. Ref: TXN-001', true, 5000, 'RWF', 'TXN-001'),
    (inst1_id, 'MoMo', NOW() - INTERVAL '2 hours', 'You have received 50,000 RWF from JEAN-PAUL M. Ref: TXN-003', true, 50000, 'RWF', 'TXN-003'),
    (inst1_id, 'MoMo', NOW() - INTERVAL '1 day', 'Payment of 50,000 RWF to LOAN-001 successful. Balance: 450,000 RWF', true, 50000, 'RWF', 'TXN-006'),
    (inst2_id, 'MoMo', NOW() - INTERVAL '1 hour', 'You have received 10,000 RWF from DIVINE K. Ref: TXN-007', true, 10000, 'RWF', 'TXN-007'),
    (inst2_id, 'MoMo', NOW() - INTERVAL '3 days', 'Payment of 250,000 RWF received. Loan balance: 750,000 RWF', true, 250000, 'RWF', 'TXN-010'),
    (inst1_id, 'MoMo', NOW() - INTERVAL '4 hours', 'You have received 5,000 RWF. Ref: Unknown sender', false, NULL, NULL, NULL),
    (inst1_id, 'MTN', NOW() - INTERVAL '6 hours', 'Your MoMo balance is 1,250,000 RWF', false, NULL, NULL, NULL),
    (inst2_id, 'MoMo', NOW() - INTERVAL '12 hours', 'Transaction failed. Insufficient balance.', false, NULL, NULL, NULL),
    (inst3_id, 'MoMo', NOW() - INTERVAL '2 days', 'You have received 2,000 RWF from EMMANUEL N. Ref: TXN-019', true, 2000, 'RWF', 'TXN-019'),
    (inst1_id, 'MoMo', NOW() - INTERVAL '5 days', 'You have received 75,000 RWF from GRACE U. Ref: TXN-020', true, 75000, 'RWF', 'TXN-020'),
    (inst1_id, 'Bank', NOW() - INTERVAL '30 days', 'Bank transfer of 500,000 RWF completed. Ref: TXN-005', true, 500000, 'RWF', 'TXN-005'),
    (inst2_id, 'Bank', NOW() - INTERVAL '90 days', 'Loan disbursement of 1,000,000 RWF processed. Ref: TXN-009', true, 1000000, 'RWF', 'TXN-009'),
    (inst1_id, 'MoMo', NOW() - INTERVAL '8 days', 'You have received 5,000 RWF. Weekly contribution.', true, 5000, 'RWF', 'TXN-016'),
    (inst1_id, 'MoMo', NOW() - INTERVAL '8 days', 'You have received 5,000 RWF. Weekly contribution.', true, 5000, 'RWF', 'TXN-017'),
    (inst2_id, 'MoMo', NOW() - INTERVAL '7 days', 'You have received 100,000 RWF from DIVINE K. Deposit.', true, 100000, 'RWF', 'TXN-008')
  ON CONFLICT DO NOTHING;

  -- ============================================
  -- RECONCILIATION ISSUES (5 demo issues)
  -- ============================================
  INSERT INTO reconciliation_issues (institution_id, source, amount, source_reference, ledger_status, status, detected_at, notes)
  VALUES 
    (inst1_id, 'MoMo SMS', 5000, 'Unknown sender', 'Missing in ledger', 'OPEN', NOW() - INTERVAL '4 hours', 'Unidentified payment received'),
    (inst1_id, 'Manual Entry', 30000, 'TXN-014', 'Failed transaction', 'OPEN', NOW() - INTERVAL '2 days', 'Member withdrawal failed but marked pending'),
    (inst2_id, 'MoMo SMS', 10000, 'Duplicate', 'Possible duplicate', 'RESOLVED', NOW() - INTERVAL '5 days', 'Verified as single transaction'),
    (inst2_id, 'Bank Statement', 250000, 'BS-12345', 'Amount mismatch', 'OPEN', NOW() - INTERVAL '3 days', 'Bank shows 250,000 but system has 240,000'),
    (inst3_id, 'Member Complaint', 2000, 'Contribution', 'Not recorded', 'IGNORED', NOW() - INTERVAL '10 days', 'Member error - contribution was for different group')
  ON CONFLICT DO NOTHING;

  -- ============================================
  -- MEETINGS (6 demo meetings)
  -- ============================================
  INSERT INTO meetings (institution_id, group_id, date, type, attendance_count, total_collected, notes, status)
  VALUES 
    (inst1_id, group1_id, CURRENT_DATE - 7, 'Regular', 11, 55000, 'Routine contributions collected.', 'COMPLETED'),
    (inst1_id, group1_id, CURRENT_DATE - 14, 'Loan Approval', 12, 60000, 'Approved loan for Grace Uwimana.', 'COMPLETED'),
    (inst1_id, group1_id, CURRENT_DATE + 7, 'Regular', 0, 0, '', 'SCHEDULED'),
    (inst2_id, group2_id, CURRENT_DATE - 30, 'Regular', 22, 220000, 'Monthly contribution meeting.', 'COMPLETED'),
    (inst2_id, group2_id, CURRENT_DATE + 14, 'AGM', 0, 0, 'Annual General Meeting', 'SCHEDULED'),
    (inst3_id, group3_id, CURRENT_DATE - 21, 'Regular', 6, 12000, 'Low attendance due to weather.', 'COMPLETED')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Demo data seeded successfully!';
END $$;
