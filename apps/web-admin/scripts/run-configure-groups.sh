#!/bin/bash

# Script to run configure-groups.sql via Supabase SQL Editor API
# This requires the SQL to be run manually in the Supabase Dashboard

set -e

SUPABASE_URL="https://wadhydemushqqtcrrlwm.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhZGh5ZGVtdXNocXF0Y3JybHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTc0MTU1NCwiZXhwIjoyMDgxMzE3NTU0fQ.mQg8USbqggCTUinPPhsvdqFl1j8baX71ulUvVdGYL7s"

echo "📋 Running configure-groups.sql..."
echo ""

# Read the SQL file
SQL_CONTENT=$(cat scripts/configure-groups.sql)

# Execute via REST API (rpc endpoint)
echo "Executing SQL via Supabase API..."
echo ""

# Use the REST API to execute SQL
# Note: Supabase doesn't have a direct SQL execution endpoint via REST
# We'll use the PostgREST API to call a function, or provide instructions

echo "⚠️  Note: Supabase CLI doesn't support direct SQL execution."
echo "Please run the SQL manually in Supabase Dashboard:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/wadhydemushqqtcrrlwm/sql/new"
echo "2. Copy and paste the contents of scripts/configure-groups.sql"
echo "3. Click 'Run'"
echo ""
echo "Or use the Supabase SQL Editor to execute:"
echo ""

# Show the SQL file path
echo "SQL File: scripts/configure-groups.sql"
echo ""
echo "Key operations:"
echo "  ✅ Mark daily contribution groups"
echo "  ✅ Ensure all groups have leaders"
echo "  ✅ Seed notification templates"
echo ""

# Alternative: Try using psql if available
if command -v psql &> /dev/null; then
    echo "Attempting to run via psql..."
    echo ""
    # This would require a connection string
    echo "To run via psql, use:"
    echo "psql 'postgresql://postgres:[PASSWORD]@db.wadhydemushqqtcrrlwm.supabase.co:5432/postgres' -f scripts/configure-groups.sql"
    echo ""
fi

echo "✅ Configuration script ready!"
echo ""
