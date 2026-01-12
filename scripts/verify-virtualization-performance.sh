#!/bin/bash
# Verification Script for Infinite Scroll and Virtualization Performance
# Tests that virtualization is working correctly and efficiently

set -e

echo "=== Infinite Scroll & Virtualization Performance Verification ==="
echo ""

# Check if @tanstack/react-virtual is installed
echo "1. Checking @tanstack/react-virtual package..."
if npm list @tanstack/react-virtual > /dev/null 2>&1; then
    echo "✅ @tanstack/react-virtual is installed"
    VERSION=$(npm list @tanstack/react-virtual 2>/dev/null | grep @tanstack/react-virtual | head -1 | awk '{print $2}')
    echo "   Version: $VERSION"
else
    echo "❌ @tanstack/react-virtual is NOT installed"
    echo "   Run: npm install @tanstack/react-virtual"
    exit 1
fi

echo ""
echo "2. Checking virtualization components..."

# Check if virtualization components exist
COMPONENTS=(
    "components/Transactions/VirtualizedTransactionTable.tsx"
    "components/members/VirtualizedMembersList.tsx"
    "components/groups/VirtualizedGroupsList.tsx"
)

MISSING=0
for COMP in "${COMPONENTS[@]}"; do
    if [ -f "$COMP" ]; then
        echo "✅ $COMP exists"
    else
        echo "❌ $COMP is missing"
        MISSING=$((MISSING + 1))
    fi
done

if [ $MISSING -gt 0 ]; then
    echo "⚠️  Some virtualization components are missing"
    exit 1
fi

echo ""
echo "3. Verifying virtualization implementation..."

# Check for useVirtualizer usage
if grep -r "useVirtualizer" components/Transactions/VirtualizedTransactionTable.tsx > /dev/null 2>&1; then
    echo "✅ Transactions table uses useVirtualizer"
else
    echo "❌ Transactions table does NOT use useVirtualizer"
    exit 1
fi

if grep -r "useVirtualizer" components/members/VirtualizedMembersList.tsx > /dev/null 2>&1; then
    echo "✅ Members list uses useVirtualizer"
else
    echo "❌ Members list does NOT use useVirtualizer"
    exit 1
fi

if grep -r "useVirtualizer" components/groups/VirtualizedGroupsList.tsx > /dev/null 2>&1; then
    echo "✅ Groups list uses useVirtualizer"
else
    echo "❌ Groups list does NOT use useVirtualizer"
    exit 1
fi

echo ""
echo "4. Verifying infinite scroll hooks..."

# Check for useInfiniteQuery usage
if grep -r "useInfiniteQuery" hooks/useMembers.ts > /dev/null 2>&1; then
    echo "✅ useMembers hook uses useInfiniteQuery"
else
    echo "❌ useMembers hook does NOT use useInfiniteQuery"
    exit 1
fi

if grep -r "useInfiniteQuery" hooks/useGroups.ts > /dev/null 2>&1; then
    echo "✅ useGroups hook uses useInfiniteQuery"
else
    echo "❌ useGroups hook does NOT use useInfiniteQuery"
    exit 1
fi

echo ""
echo "5. Verifying scroll handlers..."

# Check for scroll event handlers
if grep -r "addEventListener.*scroll" components/Transactions/VirtualizedTransactionTable.tsx > /dev/null 2>&1; then
    echo "✅ Transactions table has scroll handler"
else
    echo "⚠️  Transactions table may not have scroll handler"
fi

if grep -r "addEventListener.*scroll" components/members/VirtualizedMembersList.tsx > /dev/null 2>&1; then
    echo "✅ Members list has scroll handler"
else
    echo "⚠️  Members list may not have scroll handler"
fi

echo ""
echo "6. Checking for performance optimizations..."

# Check for overscan configuration
if grep -r "overscan" components/Transactions/VirtualizedTransactionTable.tsx > /dev/null 2>&1; then
    echo "✅ Transactions table has overscan configured"
else
    echo "⚠️  Transactions table may not have overscan configured"
fi

# Check for estimateSize
if grep -r "estimateSize" components/Transactions/VirtualizedTransactionTable.tsx > /dev/null 2>&1; then
    echo "✅ Transactions table has estimateSize configured"
else
    echo "⚠️  Transactions table may not have estimateSize configured"
fi

echo ""
echo "7. Building application to verify no errors..."

if npm run build > /tmp/build_output.log 2>&1; then
    echo "✅ Build successful"
    
    # Check for virtualization-related errors
    if grep -i "virtual" /tmp/build_output.log | grep -i "error" > /dev/null 2>&1; then
        echo "⚠️  Potential virtualization errors in build output"
        grep -i "virtual" /tmp/build_output.log | grep -i "error" | head -5
    else
        echo "✅ No virtualization errors in build"
    fi
else
    echo "❌ Build failed"
    echo "Check /tmp/build_output.log for details"
    exit 1
fi

rm -f /tmp/build_output.log

echo ""
echo "=== Verification Complete ==="
echo ""
echo "✅ All checks passed!"
echo ""
echo "Next steps for manual testing:"
echo "1. Open the application in browser"
echo "2. Navigate to Transactions page"
echo "3. Open DevTools → Elements tab"
echo "4. Scroll through the list"
echo "5. Verify DOM element count stays low (~50-100 items, not 10000+)"
echo "6. Check Performance tab for smooth scrolling (60fps)"
echo "7. Test infinite scroll by scrolling to bottom"
echo "8. Verify 'Loading more...' indicator appears"
echo "9. Repeat for Members and Groups pages"
echo ""
echo "Expected behavior:"
echo "- Only visible items are rendered in DOM"
echo "- Smooth scrolling at 60fps"
echo "- Infinite scroll loads more data automatically"
echo "- No memory leaks after extended scrolling"
echo "- Load more indicator appears when near bottom"
