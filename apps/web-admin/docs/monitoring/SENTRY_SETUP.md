# Sentry Error Monitoring Setup Guide

**Date:** 2026-01-14  
**Purpose:** Guide for setting up and verifying Sentry error monitoring

---

## Overview

Sentry is integrated into the application for comprehensive error tracking, performance monitoring, and session replay. This guide covers setup, configuration, and verification.

---

## Current Implementation

### 1. Sentry Configuration (`lib/sentry.ts`)

**Features:**
- ✅ Error tracking with filtering
- ✅ Performance monitoring (10% sample rate in prod)
- ✅ Session replay (10% sessions, 100% on errors)
- ✅ User context tracking
- ✅ Breadcrumb tracking
- ✅ Web Vitals integration

**Configuration:**
- Environment: Set from `import.meta.env.MODE`
- Release: Set from `VITE_APP_VERSION` or 'development'
- DSN: Set from `VITE_SENTRY_DSN` environment variable
- Enabled: Production only (or with `VITE_SENTRY_DEBUG=true`)

---

### 2. Initialization (`index.tsx`)

Sentry is initialized before React renders:
```typescript
import { initSentry } from './lib/sentry';
initSentry();
```

---

### 3. Error Boundaries

**ErrorBoundary** (`components/ErrorBoundary.tsx`):
- Catches React component errors
- Sends errors to Sentry
- Provides user-friendly error UI

**RouteErrorBoundary** (`components/RouteErrorBoundary.tsx`):
- Catches route-level errors
- Adds route context to errors
- Sends to Sentry with route tags

---

### 4. Web Vitals Integration

**File:** `lib/monitoring/webVitals.ts`

**Metrics Tracked:**
- CLS (Cumulative Layout Shift)
- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)
- TTFB (Time to First Byte)

**Integration:**
- Metrics sent to Sentry as distribution metrics
- Tagged with rating (good/needs-improvement/poor)
- Only in production

---

## Setup Instructions

### Step 1: Get Sentry DSN

1. Create a Sentry account at https://sentry.io
2. Create a new project (React)
3. Copy the DSN from project settings

### Step 2: Configure Environment Variable

**For Development:**
```bash
# .env.local
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_SENTRY_DEBUG=true  # Optional: enable in dev
```

**For Production:**
```bash
# Set in Cloudflare Pages environment variables
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_APP_VERSION=1.0.0  # Optional: track releases
```

### Step 3: Verify Installation

Run the verification script:
```bash
chmod +x scripts/test-sentry-integration.sh
./scripts/test-sentry-integration.sh
```

---

## Testing Error Tracking

### Manual Testing

1. **Open browser console**
2. **Run test script:**
   ```javascript
   // Copy and paste scripts/test-error-tracking.js
   // Then run: testManualErrorCapture()
   ```

3. **Check Sentry dashboard:**
   - Errors should appear within seconds
   - User context should be included
   - Breadcrumbs should be visible

### Automated Testing

**Test Error Capture:**
```javascript
import { captureError } from './lib/sentry';
captureError(new Error('Test error'), { test: true });
```

**Test User Context:**
```javascript
import { setUser } from './lib/sentry';
setUser({ id: 'user-123', email: 'user@example.com' });
```

**Test Breadcrumbs:**
```javascript
import { addBreadcrumb } from './lib/sentry';
addBreadcrumb('User action', 'user', { action: 'click' });
```

---

## Verification Checklist

### Configuration
- [x] `@sentry/react` package installed
- [x] `lib/sentry.ts` exists and configured
- [x] `initSentry()` called in `index.tsx`
- [x] `VITE_SENTRY_DSN` environment variable set
- [x] Error boundaries use Sentry
- [x] Web Vitals integrated with Sentry

### Error Tracking
- [ ] Test errors appear in Sentry dashboard
- [ ] User context is set correctly
- [ ] Breadcrumbs are captured
- [ ] Error filtering works (network errors filtered)
- [ ] React errors are caught by boundaries

### Performance Monitoring
- [ ] Performance transactions are captured
- [ ] Sample rate is correct (10% in prod)
- [ ] Transaction data is useful

### Session Replay
- [ ] Session replays are captured
- [ ] Replays are captured on errors (100%)
- [ ] Random session replays work (10%)
- [ ] Sensitive data is masked

### Web Vitals
- [ ] CLS metrics are tracked
- [ ] FCP metrics are tracked
- [ ] LCP metrics are tracked
- [ ] TTFB metrics are tracked
- [ ] Metrics have correct ratings

---

## Sentry Dashboard Features

### 1. Issues

**View:**
- All captured errors
- Error frequency
- Affected users
- Stack traces

**Actions:**
- Assign to team members
- Add tags and metadata
- Set up alerts
- Resolve/ignore issues

### 2. Performance

**View:**
- Transaction performance
- Slowest transactions
- Performance trends
- Web Vitals metrics

**Actions:**
- Identify bottlenecks
- Set performance budgets
- Track improvements

### 3. Replays

**View:**
- Session recordings
- User interactions
- Error context
- Network requests

**Actions:**
- Debug user issues
- Understand error context
- Improve UX

### 4. Releases

**View:**
- Release versions
- Error rates per release
- Deployment tracking

**Actions:**
- Track release health
- Identify problematic releases
- Rollback decisions

---

## Best Practices

### 1. Error Filtering

**Filter out:**
- Network errors (handled by `beforeSend`)
- Cancelled requests (handled by `beforeSend`)
- Known non-critical errors

**Keep:**
- Application errors
- User-facing errors
- Critical failures

### 2. User Context

**Set on login:**
```typescript
import { setUser } from './lib/sentry';
setUser({
  id: user.id,
  email: user.email,
  institutionId: user.institutionId
});
```

**Clear on logout:**
```typescript
import { clearUser } from './lib/sentry';
clearUser();
```

### 3. Breadcrumbs

**Add for important actions:**
```typescript
import { addBreadcrumb } from './lib/sentry';
addBreadcrumb('User action', 'user', { action: 'click', button: 'submit' });
```

### 4. Error Context

**Add context when capturing errors:**
```typescript
import { captureError } from './lib/sentry';
captureError(error, {
  component: 'TransactionList',
  action: 'loadTransactions',
  userId: user.id
});
```

---

## Troubleshooting

### Issue: Errors Not Appearing in Sentry

**Possible Causes:**
1. DSN not configured
2. Sentry disabled in development
3. Errors filtered by `beforeSend`
4. Network issues

**Solutions:**
1. Check `VITE_SENTRY_DSN` is set
2. Set `VITE_SENTRY_DEBUG=true` for dev testing
3. Check `beforeSend` filter logic
4. Check browser console for Sentry errors

---

### Issue: User Context Not Set

**Possible Causes:**
1. `setUser` not called on login
2. User data not available
3. Sentry not initialized

**Solutions:**
1. Verify `setUser` is called in AuthContext
2. Check user data is available
3. Verify Sentry initialization

---

### Issue: Performance Data Missing

**Possible Causes:**
1. Sample rate too low
2. Transactions not started
3. Performance monitoring disabled

**Solutions:**
1. Check `tracesSampleRate` configuration
2. Verify transactions are started
3. Check Sentry initialization

---

## Monitoring Alerts

### Recommended Alerts

1. **Error Rate Spike:**
   - Alert when error rate increases > 50%
   - Frequency: Every 5 minutes

2. **Critical Errors:**
   - Alert on new critical errors
   - Frequency: Immediately

3. **Performance Degradation:**
   - Alert when p95 latency > threshold
   - Frequency: Every 15 minutes

4. **Release Health:**
   - Alert on release with high error rate
   - Frequency: Every hour

---

## Related Files

- `lib/sentry.ts` - Sentry configuration
- `index.tsx` - Sentry initialization
- `components/ErrorBoundary.tsx` - Error boundary
- `components/RouteErrorBoundary.tsx` - Route error boundary
- `lib/monitoring/webVitals.ts` - Web Vitals integration
- `scripts/test-sentry-integration.sh` - Verification script
- `scripts/test-error-tracking.js` - Test script

---

## Next Steps

1. Set up Sentry project and get DSN
2. Configure environment variables
3. Run verification script
4. Test error tracking
5. Set up alerts
6. Monitor production errors
