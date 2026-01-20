-- ============================================================================
-- Migration: Add Daily to groups frequency constraint
-- Date: 2026-01-20
-- Purpose: Allow 'Daily' as valid frequency value for groups
-- ============================================================================

-- Drop and recreate the frequency constraint to include 'Daily'
ALTER TABLE public.groups 
DROP CONSTRAINT IF EXISTS groups_frequency_check;

ALTER TABLE public.groups 
ADD CONSTRAINT groups_frequency_check 
CHECK (frequency IN ('Daily', 'Weekly', 'Monthly'));
