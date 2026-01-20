-- ============================================================================
-- Migration: Fix groups name column issue  
-- Date: 2026-01-20
-- Purpose: Handle schema where both 'name' and 'group_name' may exist
-- ============================================================================

-- Option 1: If 'name' column exists but 'group_name' is the canonical one,
-- copy group_name values to name for existing rows and create a trigger
-- to keep them in sync

-- First, check if name column exists and if so, populate from group_name
DO $$
BEGIN
  -- If both columns exist, sync them
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'name'
  ) THEN
    -- Update any null 'name' from 'group_name'
    UPDATE public.groups 
    SET name = group_name 
    WHERE name IS NULL AND group_name IS NOT NULL;
    
    RAISE NOTICE 'Updated name column from group_name where null';
  END IF;
END $$;

-- Create trigger to keep name and group_name in sync on insert/update
CREATE OR REPLACE FUNCTION public.sync_groups_name()
RETURNS TRIGGER AS $$
BEGIN
  -- If only group_name is provided, copy to name
  IF NEW.name IS NULL AND NEW.group_name IS NOT NULL THEN
    NEW.name := NEW.group_name;
  END IF;
  -- If only name is provided, copy to group_name  
  IF NEW.group_name IS NULL AND NEW.name IS NOT NULL THEN
    NEW.group_name := NEW.name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if we have both columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'name'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_sync_groups_name ON public.groups;
    CREATE TRIGGER trigger_sync_groups_name
      BEFORE INSERT OR UPDATE ON public.groups
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_groups_name();
    RAISE NOTICE 'Created sync trigger for groups name columns';
  END IF;
END $$;
