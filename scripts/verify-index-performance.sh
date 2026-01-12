#!/bin/bash
# Verify Index Performance with EXPLAIN ANALYZE
# This script runs critical queries and verifies indexes are being used

set -e

echo "=== Verifying Index Performance ==="
echo ""
echo "This script will run EXPLAIN ANALYZE on critical queries"
echo "to verify that indexes are being used correctly."
echo ""
echo "Prerequisites:"
echo "1. Supabase project linked (supabase link)"
echo "2. Database connection available"
echo ""

# Check if supabase is linked
if ! supabase status > /dev/null 2>&1; then
    echo "⚠️  WARNING: Supabase not linked. Linking to remote project..."
    echo "Please run: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

echo "✅ Supabase project linked"
echo ""

# Create a temporary SQL file with just the EXPLAIN queries
cat > /tmp/explain_queries.sql << 'SQL_EOF'
-- Query 1: Transactions by institution and allocation status
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
  t.id,
  t.occurred_at,
  t.amount,
  t.allocation_status
FROM transactions t
WHERE t.institution_id = (SELECT id FROM institutions LIMIT 1)
  AND t.allocation_status = 'unallocated'
ORDER BY t.occurred_at DESC
LIMIT 50;

-- Query 2: Transactions by member
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
  t.id,
  t.occurred_at,
  t.amount
FROM transactions t
WHERE t.member_id IS NOT NULL
ORDER BY t.occurred_at DESC
LIMIT 100;

-- Query 3: Check index usage statistics
SELECT 
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename = 'transactions'
  AND indexname LIKE 'idx_transactions%'
ORDER BY idx_scan DESC;
SQL_EOF

echo "Running EXPLAIN ANALYZE queries..."
echo ""

# Run queries via Supabase CLI
if supabase db execute --file /tmp/explain_queries.sql 2>&1 | head -50; then
    echo ""
    echo "✅ Queries executed successfully"
    echo ""
    echo "Analysis:"
    echo "1. Check for 'Index Scan' in the output (good)"
    echo "2. Check for 'Seq Scan' in the output (bad - means index not used)"
    echo "3. Verify index_scans > 0 in statistics"
    echo ""
    echo "If you see 'Seq Scan', the index may need to be created or the query optimized."
else
    echo "⚠️  Could not execute queries directly"
    echo ""
    echo "Alternative: Run the queries manually in Supabase SQL Editor:"
    echo "1. Go to Supabase Dashboard → SQL Editor"
    echo "2. Copy queries from: supabase/migrations/20260114000000_verify_index_performance.sql"
    echo "3. Run each EXPLAIN ANALYZE query"
    echo "4. Check the output for 'Index Scan' vs 'Seq Scan'"
fi

rm -f /tmp/explain_queries.sql

echo ""
echo "=== Index Performance Verification Complete ==="
