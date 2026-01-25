#!/bin/bash

# Testing script for notifications functionality
# This script helps test the notification system

set -e

echo "🧪 Testing Notifications System"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if Supabase is configured
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${YELLOW}⚠ SUPABASE_URL and SUPABASE_ANON_KEY not set${NC}"
    echo "  Set them in your .env file or export them"
    echo ""
fi

echo -e "${BLUE}Test Checklist:${NC}"
echo ""

echo "1. Database Setup"
echo "   [ ] Migrations applied successfully"
echo "   [ ] Groups have leaders assigned"
echo "   [ ] Notification templates seeded"
echo "   [ ] Daily contribution groups marked"
echo ""

echo "2. WhatsApp Configuration"
echo "   [ ] WA_PHONE_ID set in Edge Functions"
echo "   [ ] WA_TOKEN set in Edge Functions"
echo "   [ ] WhatsApp credentials verified in Meta Business Manager"
echo ""

echo "3. Edge Functions"
echo "   [ ] generate-group-report deployed"
echo "   [ ] send-contribution-confirmation deployed"
echo "   [ ] process-pending-notifications deployed"
echo "   [ ] send-whatsapp deployed"
echo ""

echo "4. Manual Testing"
echo ""
echo -e "${YELLOW}Test 1: Contribution Confirmation${NC}"
echo "   1. Make a MoMo payment to institution MoMo code"
echo "   2. SMS should be parsed and allocated"
echo "   3. Check notification_logs table for confirmation notifications"
echo "   4. Verify member receives WhatsApp and SMS"
echo ""

echo -e "${YELLOW}Test 2: Manual Report Generation${NC}"
echo "   1. Go to Settings > Notifications"
echo "   2. Select a group"
echo "   3. Choose 'Group Report'"
echo "   4. Select report type and period"
echo "   5. Click 'Send Notification'"
echo "   6. Verify report generated in group_reports table"
echo "   7. Verify leaders received WhatsApp with PDF"
echo ""

echo -e "${YELLOW}Test 3: Contribution Reminders${NC}"
echo "   1. Go to Settings > Notifications"
echo "   2. Select a group"
echo "   3. Choose 'Contribution Reminders'"
echo "   4. Click 'Send Notification'"
echo "   5. Verify all members received reminders"
echo ""

echo -e "${YELLOW}Test 4: Periodic Totals${NC}"
echo "   1. Go to Settings > Notifications"
echo "   2. Select a group"
echo "   3. Choose 'Periodic Totals'"
echo "   4. Set period dates"
echo "   5. Click 'Send Notification'"
echo "   6. Verify members received their contribution summaries"
echo ""

echo -e "${YELLOW}Test 5: Scheduled Notifications${NC}"
echo "   1. Verify cron jobs are set up"
echo "   2. Wait for scheduled time or trigger manually"
echo "   3. Check notification_logs for scheduled notifications"
echo ""

echo -e "${BLUE}SQL Queries for Verification:${NC}"
echo ""
echo "-- Check notification logs"
echo "SELECT * FROM notification_logs ORDER BY created_at DESC LIMIT 10;"
echo ""
echo "-- Check group reports"
echo "SELECT * FROM group_reports ORDER BY generated_at DESC LIMIT 10;"
echo ""
echo "-- Check groups with leaders"
echo "SELECT g.group_name, COUNT(gm.id) as leader_count"
echo "FROM groups g"
echo "LEFT JOIN group_members gm ON gm.group_id = g.id"
echo "  AND gm.role IN ('LEADER', 'CHAIRPERSON')"
echo "  AND gm.status = 'GOOD_STANDING'"
echo "WHERE g.status = 'ACTIVE'"
echo "GROUP BY g.id, g.group_name;"
echo ""
echo "-- Check notification templates"
echo "SELECT template_type, channel, COUNT(*) as count"
echo "FROM notification_templates"
echo "WHERE is_active = true"
echo "GROUP BY template_type, channel;"
echo ""

echo -e "${GREEN}✅ Testing checklist complete${NC}"
echo ""
