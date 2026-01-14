#!/bin/bash
# Seed all demo data (idempotent - safe to run multiple times)
# Usage: ./run_seed.sh [local|remote]
#
# Seeds are designed with ON CONFLICT clauses to handle re-runs gracefully.
# Running twice should not create duplicates or errors.

set -e  # Exit on error

MODE=${1:-local}
SEED_DIR="$(dirname "$0")"

echo "=== Starting Seed Process ==="
echo "Mode: $MODE"
echo "Seed directory: $SEED_DIR"
echo ""

if [ "$MODE" = "remote" ]; then
  echo "Running seed on REMOTE Supabase..."
  echo "Make sure SUPABASE_ACCESS_TOKEN is set"
  
  for file in "$SEED_DIR"/*.sql; do
    echo "Applying $(basename "$file")..."
    npx supabase db execute --file "$file" || {
      echo "ERROR: Failed to apply $(basename "$file")"
      exit 1
    }
  done
else
  echo "Running seed on LOCAL Supabase..."
  
  for file in "$SEED_DIR"/*.sql; do
    echo "Applying $(basename "$file")..."
    npx supabase db execute --file "$file" --local || {
      echo "ERROR: Failed to apply $(basename "$file")"
      exit 1
    }
  done
fi

echo ""
echo "=== Seed Process Complete ==="
echo "All seed files applied successfully (idempotent)"
