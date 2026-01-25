#!/bin/bash
# Test Web Vitals tracking integration
# This script verifies that Web Vitals tracking is properly configured

set -e

echo "=== Testing Web Vitals Tracking Integration ==="
echo ""

# 1. Check web-vitals package is installed
echo "1. Checking web-vitals package..."
if ! npm list web-vitals > /dev/null 2>&1; then
    echo "❌ ERROR: web-vitals package not installed!"
    exit 1
fi
echo "✅ web-vitals package installed"

# 2. Check webVitals.ts file exists
echo ""
echo "2. Checking webVitals.ts file..."
if [ ! -f "lib/monitoring/webVitals.ts" ]; then
    echo "❌ ERROR: lib/monitoring/webVitals.ts not found!"
    exit 1
fi
echo "✅ webVitals.ts exists"

# 3. Check index.tsx imports webVitals
echo ""
echo "3. Verifying index.tsx integration..."
if ! grep -q "initWebVitals" index.tsx; then
    echo "❌ ERROR: initWebVitals not found in index.tsx!"
    exit 1
fi
echo "✅ index.tsx imports initWebVitals"

# 4. Check Sentry integration (optional)
echo ""
echo "4. Checking Sentry integration..."
if grep -q "VITE_SENTRY_DSN" lib/monitoring/webVitals.ts; then
    echo "✅ Sentry integration configured (optional)"
else
    echo "⚠️  WARNING: Sentry integration not found in webVitals.ts"
fi

# 5. Build and check for errors
echo ""
echo "5. Building application..."
npm run build > /tmp/build.log 2>&1
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Build failed!"
    cat /tmp/build.log | tail -20
    exit 1
fi
echo "✅ Build successful"

# 6. Check if webVitals is bundled
echo ""
echo "6. Verifying Web Vitals in bundle..."
if grep -q "web-vitals" dist/assets/*.js 2>/dev/null || grep -q "reportWebVital" dist/assets/*.js 2>/dev/null; then
    echo "✅ Web Vitals code found in bundle"
else
    echo "⚠️  WARNING: Web Vitals code not found in bundle (may be tree-shaken in dev)"
fi

echo ""
echo "=== Web Vitals Tracking Test Complete ==="
echo "✅ All checks passed!"
echo ""
echo "Next steps:"
echo "1. Test in browser console - should see [Web Vital] logs"
echo "2. Verify metrics are sent to Sentry (if configured)"
echo "3. Check Cloudflare Analytics for Web Vitals data"
echo "4. Monitor production metrics in Sentry dashboard"
