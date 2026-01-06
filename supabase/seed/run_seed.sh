#!/bin/bash
# Seed all demo data
# Usage: ./run_seed.sh [local|remote]

MODE=${1:-local}

if [ "$MODE" = "remote" ]; then
  echo "Running seed on REMOTE Supabase..."
  echo "Make sure SUPABASE_ACCESS_TOKEN is set"
  
  for file in supabase/seed/*.sql; do
    echo "Applying $file..."
    npx supabase db execute --file "$file"
  done
else
  echo "Running seed on LOCAL Supabase..."
  
  for file in supabase/seed/*.sql; do
    echo "Applying $file..."
    npx supabase db execute --file "$file" --local
  done
fi

echo "Done!"
