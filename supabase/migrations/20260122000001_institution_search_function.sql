-- Institution Search Function
-- Purpose: Provide fuzzy/semantic search for institutions used by InstitutionSemanticSearch component
-- Created: 2026-01-18

-- ============================================================================
-- STEP 1: Enable pg_trgm extension for fuzzy/trigram matching
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- STEP 2: Create GIN index on institution names for fast trigram search
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_institutions_name_trgm'
  ) THEN
    CREATE INDEX idx_institutions_name_trgm 
    ON public.institutions 
    USING GIN (name gin_trgm_ops);
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Create the search_institutions function
-- ============================================================================
-- This function provides intelligent fuzzy search for institutions:
-- - Uses trigram similarity for fuzzy matching (e.g., "kgl" matches "Kigali")
-- - Falls back to ILIKE for prefix matching
-- - Case-insensitive
-- - Orders by relevance score
-- - Returns id, name, and status columns

CREATE OR REPLACE FUNCTION public.search_institutions(search_term text)
RETURNS TABLE (
  id uuid,
  name text,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_term text;
BEGIN
  -- Normalize the search term: trim and lowercase
  normalized_term := lower(trim(search_term));
  
  -- If empty search term, return nothing
  IF normalized_term = '' OR normalized_term IS NULL THEN
    RETURN;
  END IF;
  
  -- Search using a combination of:
  -- 1. Trigram similarity (fuzzy matching)
  -- 2. ILIKE prefix matching (for short queries)
  -- 3. ILIKE contains matching
  RETURN QUERY
  SELECT DISTINCT
    i.id,
    i.name,
    i.status
  FROM public.institutions i
  WHERE 
    -- Trigram similarity > 0.1 (loose threshold for better recall)
    similarity(lower(i.name), normalized_term) > 0.1
    -- OR prefix match
    OR lower(i.name) LIKE normalized_term || '%'
    -- OR contains match
    OR lower(i.name) LIKE '%' || normalized_term || '%'
  ORDER BY 
    -- Prefer exact prefix matches first
    CASE WHEN lower(i.name) LIKE normalized_term || '%' THEN 0 ELSE 1 END,
    -- Then by trigram similarity (descending)
    similarity(lower(i.name), normalized_term) DESC,
    -- Finally alphabetically by name
    i.name ASC
  LIMIT 20;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.search_institutions(text) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.search_institutions(text) IS 
  'Semantic/fuzzy search for institutions by name. Used by InstitutionSemanticSearch component.';

-- ============================================================================
-- VERIFICATION QUERY (run manually to test)
-- ============================================================================
-- SELECT * FROM public.search_institutions('kig');
-- SELECT * FROM public.search_institutions('sacco');
-- SELECT * FROM public.search_institutions('ib');
