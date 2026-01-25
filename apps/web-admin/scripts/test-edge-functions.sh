#!/bin/bash

# Test Edge Functions Script
# Tests all deployed Edge Functions with sample data

set -e

SUPABASE_URL="https://wadhydemushqqtcrrlwm.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhZGh5ZGVtdXNocXF0Y3JybHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NDE1NTQsImV4cCI6MjA4MTMxNzU1NH0.9O6NMVpat63LnFO7hb9dLy0pz8lrMP0ZwGbIC68rdGI"

echo "🧪 Testing Edge Functions..."
echo ""

# Test 1: send-whatsapp
echo "1️⃣ Testing send-whatsapp..."
curl -X POST \
  "${SUPABASE_URL}/functions/v1/send-whatsapp" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "250788123456",
    "message": "Test message from Ibimina Gemini"
  }' \
  -w "\nStatus: %{http_code}\n" \
  2>&1 | head -20
echo ""

# Test 2: generate-group-report (requires valid group ID)
echo "2️⃣ Testing generate-group-report..."
echo "⚠️  Note: Requires valid groupId - skipping for now"
echo ""

# Test 3: staff-invite
echo "3️⃣ Testing staff-invite..."
echo "⚠️  Note: Requires valid email - skipping for now"
echo ""

# Test 4: parse-momo-sms
echo "4️⃣ Testing parse-momo-sms..."
curl -X POST \
  "${SUPABASE_URL}/functions/v1/parse-momo-sms" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "sms_text": "You have received 5000 RWF from 250788123456. Ref: ABC123. New balance: 10000 RWF."
  }' \
  -w "\nStatus: %{http_code}\n" \
  2>&1 | head -20
echo ""

echo "✅ Edge Function tests completed!"
echo ""
echo "Note: Some functions require valid data (group IDs, member IDs, etc.)"
echo "Test these manually through the UI or with actual data."
