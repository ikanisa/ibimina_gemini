#!/bin/bash
# Verify API Deduplication Implementation
# This script checks that all read/fetch functions in API files have deduplication

set -e

echo "=== Verifying API Deduplication Implementation ==="
echo ""

API_DIR="lib/api"
DEDUP_UTIL="lib/utils/requestDeduplication.ts"

# Check if deduplication utility exists
if [ ! -f "$DEDUP_UTIL" ]; then
    echo "❌ ERROR: Deduplication utility not found: $DEDUP_UTIL"
    exit 1
fi
echo "✅ Deduplication utility exists"

# List of API files to check
API_FILES=(
    "members.api.ts"
    "transactions.api.ts"
    "groups.api.ts"
    "staff.api.ts"
    "sms.api.ts"
    "reconciliation.api.ts"
    "reports.api.ts"
)

# Functions that should have deduplication (read operations)
READ_FUNCTIONS=(
    "fetchMembers"
    "fetchMembersWithGroups"
    "fetchMemberById"
    "searchMembers"
    "fetchTransactions"
    "fetchPaymentLedger"
    "fetchGroups"
    "fetchGroupsWithMemberCounts"
    "fetchGroupById"
    "fetchGroupMembers"
    "fetchGroupContributions"
    "fetchGroupDetails"
    "searchGroups"
    "fetchStaff"
    "fetchStaffById"
    "fetchSmsMessages"
    "fetchSmsMessageById"
    "searchSmsMessages"
    "fetchReconciliationIssues"
    "getReconciliationStats"
    "generateGroupReport"
    "getGroupReports"
    "getMemberContributionsSummary"
    "getGroupContributionsSummary"
    "getGroupLeaders"
)

echo ""
echo "Checking API files for deduplication..."

MISSING_DEDUP=0
TOTAL_CHECKED=0

for api_file in "${API_FILES[@]}"; do
    file_path="$API_DIR/$api_file"
    if [ ! -f "$file_path" ]; then
        echo "⚠️  WARNING: File not found: $file_path"
        continue
    fi

    # Check if file imports deduplicateRequest
    if ! grep -q "deduplicateRequest" "$file_path"; then
        echo "⚠️  WARNING: $api_file does not import deduplicateRequest"
    fi

    # Check each read function
    for func in "${READ_FUNCTIONS[@]}"; do
        if grep -q "export.*function.*$func" "$file_path"; then
            TOTAL_CHECKED=$((TOTAL_CHECKED + 1))
            if ! grep -A 10 "export.*function.*$func" "$file_path" | grep -q "deduplicateRequest"; then
                echo "❌ MISSING: $api_file::$func does not use deduplicateRequest"
                MISSING_DEDUP=$((MISSING_DEDUP + 1))
            else
                echo "✅ $api_file::$func has deduplication"
            fi
        fi
    done
done

echo ""
echo "=== Verification Summary ==="
echo "Total read functions checked: $TOTAL_CHECKED"
echo "Functions with deduplication: $((TOTAL_CHECKED - MISSING_DEDUP))"
echo "Functions missing deduplication: $MISSING_DEDUP"

if [ $MISSING_DEDUP -eq 0 ]; then
    echo ""
    echo "✅ All read functions have deduplication!"
    exit 0
else
    echo ""
    echo "❌ Some functions are missing deduplication"
    exit 1
fi
