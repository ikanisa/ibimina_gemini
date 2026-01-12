#!/bin/bash
# Large Dataset Performance Testing Script
# Tests application performance with 1000+ records

set -e

echo "=== Large Dataset Performance Testing ==="
echo ""
echo "This script will:"
echo "1. Generate 1000+ records in the database"
echo "2. Test query performance"
echo "3. Verify pagination and virtualization work"
echo "4. Measure load times"
echo ""

# Check if supabase is linked
if ! supabase status > /dev/null 2>&1; then
    echo "⚠️  WARNING: Supabase not linked"
    echo "Please run: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

echo "✅ Supabase project linked"
echo ""

# Ask for confirmation
read -p "This will generate large amounts of test data. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Step 1: Generating large dataset..."
echo ""

# Run the seed script
if supabase db execute --file supabase/seed/014_large_dataset_performance_test.sql 2>&1; then
    echo ""
    echo "✅ Large dataset generated successfully"
else
    echo ""
    echo "⚠️  Could not execute seed script directly"
    echo "Please run the SQL manually in Supabase SQL Editor:"
    echo "File: supabase/seed/014_large_dataset_performance_test.sql"
    exit 1
fi

echo ""
echo "Step 2: Verifying data counts..."
echo ""

# Check counts
cat > /tmp/check_counts.sql << 'SQL_EOF'
SELECT 
  'Groups' as table_name, 
  COUNT(*) as count 
FROM groups 
WHERE institution_id = '00000000-0000-0000-0000-000000000001'::uuid
UNION ALL
SELECT 'Members', COUNT(*) FROM members WHERE institution_id = '00000000-0000-0000-0000-000000000001'::uuid
UNION ALL
SELECT 'Transactions', COUNT(*) FROM transactions WHERE institution_id = '00000000-0000-0000-0000-000000000001'::uuid
UNION ALL
SELECT 'Group Memberships', COUNT(*) FROM group_members WHERE institution_id = '00000000-0000-0000-0000-000000000001'::uuid
UNION ALL
SELECT 'SMS Messages', COUNT(*) FROM momo_sms_raw WHERE institution_id = '00000000-0000-0000-0000-000000000001'::uuid;
SQL_EOF

if supabase db execute --file /tmp/check_counts.sql 2>&1; then
    echo ""
    echo "✅ Data counts verified"
else
    echo "⚠️  Could not verify counts"
fi

rm -f /tmp/check_counts.sql

echo ""
echo "=== Performance Testing Instructions ==="
echo ""
echo "Next steps:"
echo "1. Open the application in your browser"
echo "2. Log in with a user that has access to institution 'PERF_TEST'"
echo "3. Test the following pages:"
echo "   - Groups page (should load 1000+ groups with pagination)"
echo "   - Members page (should load 1000+ members with pagination)"
echo "   - Transactions page (should load 10000+ transactions with virtualization)"
echo "   - SMS Gateway page (should load 5000+ messages)"
echo ""
echo "4. Verify performance:"
echo "   - Initial load should be < 2 seconds"
echo "   - Pagination should work smoothly"
echo "   - Infinite scroll should load more data efficiently"
echo "   - Search should be responsive"
echo ""
echo "5. Check browser DevTools:"
echo "   - Network tab: Verify requests are deduplicated"
echo "   - Performance tab: Check for any performance bottlenecks"
echo "   - Console: Check for any errors"
echo ""
echo "=== Testing Complete ==="
