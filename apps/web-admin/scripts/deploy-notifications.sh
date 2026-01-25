#!/bin/bash

# Deployment script for Group Leaders & WhatsApp Notifications
# This script helps deploy all necessary components

set -e

echo "🚀 Deploying Group Leaders & WhatsApp Notifications..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Please install it first:${NC}"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${RED}❌ Not in a Supabase project directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Applying database migrations...${NC}"
echo ""

# Apply migrations
MIGRATIONS=(
    "supabase/migrations/20260111000000_group_leaders_whatsapp.sql"
    "supabase/migrations/20260111000001_contribution_confirmation.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$migration" ]; then
        echo "  ✓ Found: $migration"
    else
        echo -e "  ${RED}✗ Missing: $migration${NC}"
        exit 1
    fi
done

echo ""
echo "  Applying migrations via Supabase CLI..."
supabase db push

echo ""
echo -e "${GREEN}✓ Migrations applied${NC}"
echo ""

echo -e "${YELLOW}Step 2: Deploying Edge Functions...${NC}"
echo ""

FUNCTIONS=(
    "generate-group-report"
    "send-scheduled-notifications"
    "send-contribution-confirmation"
    "process-pending-notifications"
    "send-whatsapp"
)

for func in "${FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
        echo "  Deploying: $func"
        supabase functions deploy "$func" || {
            echo -e "  ${RED}✗ Failed to deploy $func${NC}"
            exit 1
        }
        echo -e "  ${GREEN}✓ Deployed: $func${NC}"
    else
        echo -e "  ${YELLOW}⚠ Skipping: $func (not found)${NC}"
    fi
done

echo ""
echo -e "${GREEN}✓ Edge Functions deployed${NC}"
echo ""

echo -e "${YELLOW}Step 3: Setting up WhatsApp credentials...${NC}"
echo ""
echo "  Run the setup script to configure WhatsApp:"
echo "  deno run --allow-net --allow-env scripts/set-whatsapp-secrets.ts"
echo ""
echo "  Or manually set these environment variables in Supabase Dashboard:"
echo "  - WA_PHONE_ID"
echo "  - META_WABA_BUSINESS_ID"
echo "  - WA_TOKEN"
echo "  - WA_VERIFY_TOKEN"
echo "  - WA_APP_SECRET"
echo ""

echo -e "${YELLOW}Step 4: Next steps...${NC}"
echo ""
echo "  1. Set WhatsApp credentials (see above)"
echo "  2. Configure cron jobs (see docs/GROUP_LEADERS_WHATSAPP_SETUP.md)"
echo "  3. Run configuration SQL (see scripts/configure-groups.sql)"
echo "  4. Test the implementation (see scripts/test-notifications.sh)"
echo ""

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
