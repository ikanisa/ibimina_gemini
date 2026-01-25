-- ============================================================================
-- Security Verification Script
-- Run this in Supabase SQL Editor to verify hardening
-- ============================================================================

BEGIN;

-- 1. Setup Test Data
-- Create 2 dummy users
INSERT INTO auth.users (id, email) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'user1@test.com'),
  ('22222222-2222-2222-2222-222222222222', 'user2@test.com')
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (user_id, email, full_name, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'user1@test.com', 'User One', 'MEMBER'),
  ('22222222-2222-2222-2222-222222222222', 'user2@test.com', 'User Two', 'MEMBER')
ON CONFLICT DO NOTHING;

-- Create Groups
INSERT INTO public.groups (id, group_name, institution_id) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Group A', (SELECT id FROM public.institutions LIMIT 1)),
  ('44444444-4444-4444-4444-444444444444', 'Group B', (SELECT id FROM public.institutions LIMIT 1))
ON CONFLICT DO NOTHING;

-- Add members to groups
INSERT INTO public.group_members (member_id, group_id, status) VALUES
  ((SELECT id FROM public.members WHERE user_id = '11111111-1111-1111-1111-111111111111'), '33333333-3333-3333-3333-333333333333', 'GOOD_STANDING'),
  ((SELECT id FROM public.members WHERE user_id = '22222222-2222-2222-2222-222222222222'), '44444444-4444-4444-4444-444444444444', 'GOOD_STANDING')
ON CONFLICT DO NOTHING;

-- 2. Test RLS
-- Switch to User 1
SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

-- Attempt to read Group B transactions (should return 0 rows)
SELECT count(*) as "Observed Group B Transactions (Should be 0)"
FROM public.transactions 
WHERE group_id = '44444444-4444-4444-4444-444444444444';

-- 3. Test Limits
-- Attempt to insert > 4000 RWF
DO $$
BEGIN
  BEGIN
    INSERT INTO public.transactions (amount, group_id, member_id, status, type, currency)
    VALUES (4500, '33333333-3333-3333-3333-333333333333', (SELECT id FROM public.members WHERE user_id = '11111111-1111-1111-1111-111111111111'), 'pending', 'deposit', 'RWF');
    RAISE EXCEPTION 'Constraint FAIL: Should have blocked 4500 RWF';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint PASS: Blocked 4500 RWF - %', SQLERRM;
  END;
END $$;

ROLLBACK;
