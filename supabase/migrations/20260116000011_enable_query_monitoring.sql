-- Enable query performance monitoring
-- This migration enables pg_stat_statements extension for query performance tracking

-- Enable pg_stat_statements extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create view for slow queries (queries taking > 1 second)
CREATE OR REPLACE VIEW slow_queries AS
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time,
  min_exec_time,
  stddev_exec_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM extensions.pg_stat_statements
WHERE mean_exec_time > 1000 -- Queries taking > 1 second on average
ORDER BY mean_exec_time DESC
LIMIT 100;

-- Create view for most frequently executed queries
CREATE OR REPLACE VIEW frequent_queries AS
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM extensions.pg_stat_statements
ORDER BY calls DESC
LIMIT 100;

-- Create view for queries with highest total execution time
CREATE OR REPLACE VIEW top_queries_by_time AS
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM extensions.pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 100;

-- Create function to get query statistics
CREATE OR REPLACE FUNCTION get_query_stats(
  min_duration_ms NUMERIC DEFAULT 1000,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  query TEXT,
  calls BIGINT,
  total_exec_time NUMERIC,
  mean_exec_time NUMERIC,
  max_exec_time NUMERIC,
  rows BIGINT,
  hit_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pg_stat_statements.query,
    pg_stat_statements.calls,
    pg_stat_statements.total_exec_time,
    pg_stat_statements.mean_exec_time,
    pg_stat_statements.max_exec_time,
    pg_stat_statements.rows,
    100.0 * pg_stat_statements.shared_blks_hit / 
      NULLIF(pg_stat_statements.shared_blks_hit + pg_stat_statements.shared_blks_read, 0) AS hit_percent
  FROM extensions.pg_stat_statements
  WHERE extensions.pg_stat_statements.mean_exec_time > min_duration_ms
  ORDER BY extensions.pg_stat_statements.mean_exec_time DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users (for monitoring dashboard)
GRANT SELECT ON slow_queries TO authenticated;
GRANT SELECT ON frequent_queries TO authenticated;
GRANT SELECT ON top_queries_by_time TO authenticated;
GRANT EXECUTE ON FUNCTION get_query_stats TO authenticated;

-- Create RPC function to reset query statistics (admin only)
CREATE OR REPLACE FUNCTION reset_query_stats()
RETURNS void AS $$
BEGIN
  PERFORM pg_stat_statements_reset();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only allow service role to reset stats
GRANT EXECUTE ON FUNCTION reset_query_stats TO service_role;

-- Add comment
COMMENT ON EXTENSION pg_stat_statements IS 'Tracks query performance statistics for APM';
COMMENT ON VIEW slow_queries IS 'Queries taking > 1 second on average';
COMMENT ON VIEW frequent_queries IS 'Most frequently executed queries';
COMMENT ON VIEW top_queries_by_time IS 'Queries with highest total execution time';
COMMENT ON FUNCTION get_query_stats IS 'Get query statistics filtered by minimum duration';
