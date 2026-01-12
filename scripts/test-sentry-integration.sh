#!/bin/bash
# Sentry Integration Testing Script
# Tests error monitoring and Sentry integration

set -e

echo "=== Sentry Error Monitoring Integration Test ==="
echo ""

# Check if @sentry/react is installed
echo "1. Checking @sentry/react package..."
if npm list @sentry/react > /dev/null 2>&1; then
    echo "✅ @sentry/react is installed"
    VERSION=$(npm list @sentry/react 2>/dev/null | grep @sentry/react | head -1 | awk '{print $2}')
    echo "   Version: $VERSION"
else
    echo "❌ @sentry/react is NOT installed"
    echo "   Run: npm install @sentry/react"
    exit 1
fi

echo ""
echo "2. Checking Sentry configuration file..."

if [ -f "lib/sentry.ts" ]; then
    echo "✅ lib/sentry.ts exists"
    
    # Check for key functions
    if grep -q "initSentry" lib/sentry.ts; then
        echo "✅ initSentry function found"
    else
        echo "❌ initSentry function NOT found"
        exit 1
    fi
    
    if grep -q "captureError" lib/sentry.ts; then
        echo "✅ captureError function found"
    else
        echo "⚠️  captureError function NOT found"
    fi
    
    if grep -q "setUser" lib/sentry.ts; then
        echo "✅ setUser function found"
    else
        echo "⚠️  setUser function NOT found"
    fi
else
    echo "❌ lib/sentry.ts does NOT exist"
    exit 1
fi

echo ""
echo "3. Checking Sentry initialization in index.tsx..."

if grep -q "initSentry" index.tsx; then
    echo "✅ Sentry initialized in index.tsx"
else
    echo "❌ Sentry NOT initialized in index.tsx"
    exit 1
fi

echo ""
echo "4. Checking error boundaries..."

if [ -f "components/ErrorBoundary.tsx" ]; then
    echo "✅ ErrorBoundary component exists"
    if grep -q "captureError\|Sentry" components/ErrorBoundary.tsx; then
        echo "✅ ErrorBoundary uses Sentry"
    else
        echo "⚠️  ErrorBoundary may not use Sentry"
    fi
else
    echo "⚠️  ErrorBoundary component NOT found"
fi

if [ -f "components/RouteErrorBoundary.tsx" ]; then
    echo "✅ RouteErrorBoundary component exists"
    if grep -q "Sentry\|captureException" components/RouteErrorBoundary.tsx; then
        echo "✅ RouteErrorBoundary uses Sentry"
    else
        echo "⚠️  RouteErrorBoundary may not use Sentry"
    fi
else
    echo "⚠️  RouteErrorBoundary component NOT found"
fi

echo ""
echo "5. Checking Web Vitals integration..."

if [ -f "lib/monitoring/webVitals.ts" ]; then
    echo "✅ webVitals.ts exists"
    if grep -q "Sentry\|@sentry" lib/monitoring/webVitals.ts; then
        echo "✅ Web Vitals integrated with Sentry"
    else
        echo "⚠️  Web Vitals may not be integrated with Sentry"
    fi
else
    echo "⚠️  webVitals.ts NOT found"
fi

echo ""
echo "6. Checking environment variables..."

if grep -q "VITE_SENTRY_DSN" .env.example 2>/dev/null || grep -q "VITE_SENTRY_DSN" .env 2>/dev/null; then
    echo "✅ VITE_SENTRY_DSN environment variable documented"
else
    echo "⚠️  VITE_SENTRY_DSN environment variable not found in .env files"
    echo "   Note: This is optional - Sentry will work if DSN is set"
fi

echo ""
echo "7. Building application to verify no errors..."

if npm run build > /tmp/build_output.log 2>&1; then
    echo "✅ Build successful"
    
    # Check for Sentry-related errors
    if grep -i "sentry" /tmp/build_output.log | grep -i "error" > /dev/null 2>&1; then
        echo "⚠️  Potential Sentry errors in build output"
        grep -i "sentry" /tmp/build_output.log | grep -i "error" | head -5
    else
        echo "✅ No Sentry errors in build"
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
echo "1. Set VITE_SENTRY_DSN environment variable (if not already set)"
echo "2. Deploy to production or staging environment"
echo "3. Trigger test errors (see: scripts/test-error-tracking.js)"
echo "4. Verify errors appear in Sentry dashboard"
echo "5. Check user context is set correctly"
echo "6. Verify Web Vitals are being tracked"
echo ""
echo "Expected behavior:"
echo "- Errors are captured and sent to Sentry"
echo "- User context is set on login"
echo "- Web Vitals metrics are tracked"
echo "- Error boundaries catch React errors"
echo "- Session replay captures errors (if enabled)"
