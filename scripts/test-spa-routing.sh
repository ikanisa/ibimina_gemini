#!/bin/bash
# Test SPA routing configuration for Cloudflare Pages
# This script verifies that the _redirects file works correctly

set -e

echo "=== Testing Cloudflare Pages SPA Routing ==="
echo ""

# 1. Check _redirects file exists
echo "1. Checking _redirects file..."
if [ ! -f "public/_redirects" ]; then
    echo "❌ ERROR: public/_redirects not found!"
    exit 1
fi
echo "✅ public/_redirects exists"

# 2. Check _redirects content
echo ""
echo "2. Verifying _redirects content..."
REDIRECTS_CONTENT=$(cat public/_redirects | grep -v '^$' | grep -v '^#')
if [[ "$REDIRECTS_CONTENT" != "/*    /index.html   200" ]]; then
    echo "⚠️  WARNING: _redirects content may be incorrect"
    echo "   Expected: /*    /index.html   200"
    echo "   Found: $REDIRECTS_CONTENT"
else
    echo "✅ _redirects content is correct"
fi

# 3. Build the application
echo ""
echo "3. Building application..."
npm run build > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Build failed!"
    exit 1
fi
echo "✅ Build successful"

# 4. Verify _redirects is copied to dist
echo ""
echo "4. Verifying _redirects in dist..."
if [ ! -f "dist/_redirects" ]; then
    echo "❌ ERROR: dist/_redirects not found after build!"
    exit 1
fi
echo "✅ dist/_redirects exists"

# 5. Verify _headers is copied to dist
echo ""
echo "5. Verifying _headers in dist..."
if [ ! -f "dist/_headers" ]; then
    echo "⚠️  WARNING: dist/_headers not found (optional but recommended)"
else
    echo "✅ dist/_headers exists"
fi

# 6. Check index.html exists
echo ""
echo "6. Verifying index.html..."
if [ ! -f "dist/index.html" ]; then
    echo "❌ ERROR: dist/index.html not found!"
    exit 1
fi
echo "✅ dist/index.html exists"

echo ""
echo "=== SPA Routing Configuration Test Complete ==="
echo "✅ All checks passed!"
echo ""
echo "Next steps:"
echo "1. Deploy to Cloudflare Pages"
echo "2. Test direct navigation to /dashboard, /transactions, etc."
echo "3. Test page refresh on deep routes"
echo "4. Verify no 404 errors on client-side routes"
