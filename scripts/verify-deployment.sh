#!/bin/bash

# Deployment Verification Script
# This script verifies that all components are properly deployed

set -e

echo "🔍 Starting Deployment Verification..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Please install it first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Checking Environment Variables...${NC}"
if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}❌ SUPABASE_URL not set${NC}"
    exit 1
fi
if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ SUPABASE_ANON_KEY not set${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""

echo -e "${YELLOW}📋 Checking Database Connection...${NC}"
if supabase db ping &> /dev/null; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}📋 Checking Migrations...${NC}"
MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')
if [ "$MIGRATION_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $MIGRATION_COUNT migration files${NC}"
else
    echo -e "${RED}❌ No migration files found${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}📋 Checking Edge Functions...${NC}"
EDGE_FUNCTIONS=(
    "generate-group-report"
    "send-scheduled-notifications"
    "send-contribution-confirmation"
    "process-pending-notifications"
    "send-whatsapp"
    "staff-invite"
)

for func in "${EDGE_FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
        echo -e "${GREEN}✅ $func exists${NC}"
    else
        echo -e "${RED}❌ $func not found${NC}"
    fi
done
echo ""

echo -e "${YELLOW}📋 Checking Required Tables...${NC}"
REQUIRED_TABLES=(
    "institutions"
    "groups"
    "members"
    "group_members"
    "transactions"
    "transaction_allocations"
    "momo_sms_raw"
    "sms_gateway_devices"
    "profiles"
    "institution_momo_codes"
    "settings"
    "notification_templates"
    "notification_logs"
    "group_reports"
    "audit_log"
)

# Note: This would require database access to verify
echo -e "${YELLOW}⚠️  Table verification requires database access${NC}"
echo -e "${YELLOW}   Run: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';${NC}"
echo ""

echo -e "${YELLOW}📋 Checking RPC Functions...${NC}"
REQUIRED_RPCS=(
    "get_dashboard_summary"
    "get_report_summary"
    "get_report_ledger"
    "get_transaction_details"
    "allocate_transaction"
    "create_member"
    "create_institution"
    "update_institution"
    "set_institution_momo_code"
    "create_staff_invite"
    "update_staff_role"
    "deactivate_staff"
)

# Note: This would require database access to verify
echo -e "${YELLOW}⚠️  RPC verification requires database access${NC}"
echo -e "${YELLOW}   Run: SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';${NC}"
echo ""

echo -e "${YELLOW}📋 Checking Frontend Build...${NC}"
if [ -d "dist" ] || [ -d "build" ]; then
    echo -e "${GREEN}✅ Frontend build directory exists${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend not built. Run: npm run build${NC}"
fi
echo ""

echo -e "${YELLOW}📋 Checking Configuration Files...${NC}"
if [ -f "supabase/config.toml" ]; then
    echo -e "${GREEN}✅ Supabase config exists${NC}"
else
    echo -e "${RED}❌ Supabase config not found${NC}"
fi

if [ -f ".env" ] || [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ Environment file exists${NC}"
else
    echo -e "${YELLOW}⚠️  Environment file not found${NC}"
fi
echo ""

echo -e "${GREEN}✅ Deployment verification complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "  1. Verify all tables exist in database"
echo "  2. Verify all RPC functions are deployed"
echo "  3. Deploy Edge Functions: supabase functions deploy"
echo "  4. Test each Edge Function"
echo "  5. Configure environment variables in Supabase Dashboard"
echo "  6. Run manual testing checklist"
echo ""
