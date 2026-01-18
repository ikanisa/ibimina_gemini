-- Fix Institution Search Function
-- Purpose: Fix the SELECT DISTINCT + ORDER BY incompatibility
-- Created: 2026-01-18

-- ============================================================================
-- Drop and recreate the search_institutions function with fixed SQL
-- ============================================================================

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
  
  -- Use a subquery to handle the DISTINCT + ORDER BY properly
  RETURN QUERY
  SELECT sub.id, sub.name, sub.status
  FROM (
    SELECT 
      i.id,
      i.name,
      i.status,
      -- Compute ordering columns in subquery
      CASE WHEN lower(i.name) LIKE normalized_term || '%' THEN 0 ELSE 1 END AS prefix_rank,
      similarity(lower(i.name), normalized_term) AS sim_score
    FROM public.institutions i
    WHERE 
      -- Trigram similarity > 0.1 (loose threshold for better recall)
      similarity(lower(i.name), normalized_term) > 0.1
      -- OR prefix match
      OR lower(i.name) LIKE normalized_term || '%'
      -- OR contains match
      OR lower(i.name) LIKE '%' || normalized_term || '%'
  ) sub
  ORDER BY 
    sub.prefix_rank,
    sub.sim_score DESC,
    sub.name ASC
  LIMIT 20;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.search_institutions(text) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.search_institutions(text) IS 
  'Semantic/fuzzy search for institutions by name. Uses pg_trgm for fuzzy matching.';
