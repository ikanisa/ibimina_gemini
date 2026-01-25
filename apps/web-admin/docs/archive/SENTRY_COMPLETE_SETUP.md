# Complete Sentry Error Tracking Setup

## Overview

Sentry has been fully configured for comprehensive error tracking, performance monitoring, and session replay across the application.

## Current Configuration

### Frontend (React)

**File:** `lib/sentry.ts`

**Features:**
- ✅ Error tracking with intelligent filtering
- ✅ Performance monitoring (10% sample rate in production)
- ✅ Session replay (10% sessions, 100% on errors)
- ✅ User context tracking
- ✅ Breadcrumb tracking
- ✅ Release tracking
- ✅ Source map support

**Configuration:**
- **DSN**: Set via `VITE_SENTRY_DSN` environment variable
- **Environment**: Automatically set from `import.meta.env.MODE`
- **Release**: Set from `VITE_APP_VERSION` or git commit
- **Enabled**: Production only (or with `VITE_SENTRY_DEBUG=true`)

### Edge Functions (Deno)

**File:** `supabase/functions/_shared/sentry.ts`

**Features:**
- ✅ Error logging with context
- ✅ Structured error format (can forward to Sentry)
- ✅ User context tracking
- ✅ Request ID tracking

**Note:** Full Sentry SDK for Deno is not yet available. Errors are logged in a format that can be forwarded to Sentry via webhook.

## Setup Instructions

### Step 1: Create Sentry Project

1. Go to https://sentry.io and sign up/login
2. Create a new project:
   - **Platform**: React
   - **Project Name**: `sacco-admin-portal`
   - **Organization**: Your organization
3. Copy the DSN from project settings

### Step 2: Configure Environment Variables

#### For Development (`.env.local`):

```bash
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_SENTRY_DEBUG=true  # Optional: enable in dev
VITE_APP_VERSION=0.1.0  # Optional: set version
```

#### For Production (Cloudflare Pages):

1. Go to Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables
2. Add:
   - `VITE_SENTRY_DSN`: Your Sentry DSN
   - `VITE_APP_VERSION`: Your app version (or use git commit)

### Step 3: Configure Source Maps

#### Install Sentry CLI:

```bash
# macOS/Linux
curl -sL https://sentry.io/get-cli/ | sh

# Or via npm
npm install -g @sentry/cli
```

#### Set Auth Token:

1. Go to Sentry → Settings → Account → Auth Tokens
2. Create new token with `project:releases` scope
3. Set environment variable:
   ```bash
   export SENTRY_AUTH_TOKEN=your-token-here
   ```

#### Upload Source Maps:

After building, upload source maps:

```bash
# Make script executable
chmod +x scripts/upload-sourcemaps.sh

# Run after build
npm run build
./scripts/upload-sourcemaps.sh
```

Or integrate into build process:

```json
{
  "scripts": {
    "build": "vite build && ./scripts/upload-sourcemaps.sh"
  }
}
```

### Step 4: Configure Release Tracking

Set version in build:

```bash
# Using package.json version
VITE_APP_VERSION=$(node -p "require('./package.json').version") npm run build

# Or using git commit
VITE_APP_VERSION=$(git rev-parse --short HEAD) npm run build
```

### Step 5: Set Up Alerts

In Sentry Dashboard → Alerts:

1. **New Issue Alert**:
   - Trigger: New issue created
   - Action: Email/Slack notification

2. **Error Spike Alert**:
   - Trigger: >10 errors in 1 minute
   - Action: Email + Slack

3. **Performance Degradation**:
   - Trigger: P95 response time > 2s
   - Action: Email team

## Usage

### Capturing Errors

```typescript
import { captureError } from './lib/sentry';

try {
  // Some operation
} catch (error) {
  captureError(error, {
    component: 'TransactionList',
    action: 'fetchTransactions',
  });
}
```

### Setting User Context

User context is automatically set in `AuthContext.tsx`:

```typescript
import { setUser } from './lib/sentry';

setUser({
  id: user.id,
  email: user.email,
  institutionId: institutionId,
});
```

### Adding Breadcrumbs

```typescript
import { addBreadcrumb } from './lib/sentry';

addBreadcrumb('User clicked button', 'user-action', {
  buttonId: 'submit-transaction',
});
```

### Performance Monitoring

```typescript
import { startTransaction } from './lib/sentry';

const transaction = startTransaction('fetchMembers', 'db.query');
// ... perform operation
transaction.finish();
```

## Edge Functions Error Tracking

Edge Functions log errors in a structured format:

```typescript
import { logError } from '../_shared/sentry.ts';

try {
  // Operation
} catch (error) {
  logError(error, {
    functionName: 'sms-ingest',
    userId: user?.id,
    institutionId: institutionId,
    requestId: req.headers.get('x-request-id'),
  });
}
```

**Forwarding to Sentry:**

You can set up a webhook to forward Edge Function errors to Sentry:

1. Create Sentry webhook endpoint
2. Configure Edge Function to POST errors to webhook
3. Sentry will receive and process errors

## Error Filtering

Sentry automatically filters out:
- Network errors (handled by retry logic)
- Cancelled requests
- Timeout errors (handled by timeout logic)
- Invalid login credentials (handled by app)

To add custom filters, edit `beforeSend` in `lib/sentry.ts`.

## Performance Monitoring

### Sample Rates

- **Production**: 10% of transactions
- **Development**: 100% of transactions (when enabled)

### Metrics Tracked

- Page load times
- API request durations
- Database query times
- Component render times

## Session Replay

### Sample Rates

- **Sessions**: 10% of all sessions
- **Errors**: 100% of sessions with errors

### Privacy

- All text is masked
- All media is blocked
- Sensitive data is not captured

## Testing

### Test Error Capture

```typescript
// In browser console (production)
import { captureError } from './lib/sentry';
captureError(new Error('Test error'));
```

### Test in Sentry

1. Trigger a test error in production
2. Check Sentry Dashboard → Issues
3. Verify error appears with full context

## Monitoring Dashboard

### Key Metrics to Monitor

1. **Error Rate**: Should be < 1% of sessions
2. **Error Trends**: Watch for spikes
3. **Performance**: P95 < 2s
4. **Release Health**: Monitor new releases

### Weekly Review

Every Monday, review:
- [ ] New issues created
- [ ] Error trends
- [ ] Performance metrics
- [ ] User feedback

## Troubleshooting

### Errors Not Appearing in Sentry

1. **Check DSN is set**:
   ```bash
   echo $VITE_SENTRY_DSN
   ```

2. **Check Sentry is enabled**:
   - Production: Should be enabled automatically
   - Development: Set `VITE_SENTRY_DEBUG=true`

3. **Check browser console**:
   - Look for Sentry initialization messages
   - Check for network errors to Sentry API

### Source Maps Not Working

1. **Verify source maps are generated**:
   ```bash
   ls -la dist/assets/*.js.map
   ```

2. **Check upload script**:
   ```bash
   ./scripts/upload-sourcemaps.sh
   ```

3. **Verify release in Sentry**:
   - Go to Sentry → Releases
   - Check source maps are attached

### Performance Data Missing

1. **Check sample rate**: Should be 10% in production
2. **Verify browser tracing**: Check network tab for Sentry requests
3. **Check Sentry dashboard**: Performance → Transactions

## Files

- `lib/sentry.ts` - Frontend Sentry configuration
- `supabase/functions/_shared/sentry.ts` - Edge Functions error logging
- `scripts/upload-sourcemaps.sh` - Source map upload script
- `.sentryclirc` - Sentry CLI configuration
- `vite.config.ts` - Source map generation

## Next Steps

1. **Set up Sentry project** and get DSN
2. **Configure environment variables** in Cloudflare Pages
3. **Set up source map upload** in CI/CD
4. **Configure alerts** in Sentry Dashboard
5. **Test error capture** in production
6. **Set up weekly reviews** for error trends

## Cost Considerations

Sentry pricing (as of 2026):
- **Free tier**: 5,000 errors/month
- **Team tier**: $26/month (50,000 errors/month)
- **Business tier**: $80/month (unlimited errors)

For production, Team tier is recommended.
