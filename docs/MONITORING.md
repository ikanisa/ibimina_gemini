# Ibimina Gemini Monitoring Guide

## Overview

This guide covers monitoring, alerting, and incident response for the Ibimina Gemini platform deployed on Cloudflare Pages with Supabase backend.

---

## Key Metrics to Monitor

### Application Performance

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Page Load Time | < 2s | > 5s |
| Time to Interactive | < 3.5s | > 7s |
| API Response Time | < 500ms | > 2s |
| Error Rate | < 0.1% | > 1% |

### Business Metrics

| Metric | Description |
|--------|-------------|
| Daily Active Users (DAU) | Unique logins per day |
| Transactions/Day | Total transactions processed |
| Allocation Rate | % of transactions allocated |
| SMS Ingest Rate | Messages processed per hour |
| Parse Error Rate | % of SMS failing to parse |

### Infrastructure Metrics

- Cloudflare: Request count, bandwidth, error ratio
- Supabase: Database connections, query latency, storage usage
- Edge Functions: Invocation count, error rate, cold starts

---

## Monitoring Tools

### Cloudflare Analytics

Access: Cloudflare Dashboard → Analytics & Logs → Web Analytics

Key Views:
- **Traffic**: Page views, unique visitors, top pages
- **Performance**: Core Web Vitals (LCP, FID, CLS)
- **Errors**: 4xx and 5xx error rates by page

### Supabase Dashboard

Access: Supabase Dashboard → Project → Logs

Available Logs:
- **Database Logs**: Query performance, connection issues
- **Auth Logs**: Login attempts, session management
- **Edge Function Logs**: Function execution, errors

Filter Logs:
```sql
-- Find slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check connection count
SELECT count(*) FROM pg_stat_activity;
```

### Sentry Error Tracking

Configuration is in `lib/sentry.ts`. View errors at sentry.io.

Key Features:
- Real-time error alerts
- Stack traces with source maps
- User session replay (if enabled)
- Performance tracing

---

## Custom Monitoring

### Application Health Check

The app exposes implicit health through successful loading. Consider adding:

```typescript
// lib/monitoring/health.ts
export async function checkHealth() {
  const checks = {
    database: await checkDatabaseConnection(),
    auth: await checkAuthService(),
    storage: await checkStorageService(),
  };
  
  return {
    status: Object.values(checks).every(c => c) ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  };
}
```

### Performance Tracking

```typescript
// Already in lib/performance.ts
import { trackError, trackPerformance } from '@/lib/monitoring';

// Track page load
trackPerformance('dashboard-load', loadTimeMs);

// Track API calls
trackPerformance('api-transaction-fetch', responseTimeMs);
```

### Real User Monitoring (RUM)

Web Vitals are tracked via `web-vitals` package:

```typescript
// Already in lib/performance.ts
import { onCLS, onFID, onLCP } from 'web-vitals';

onLCP(metric => console.log('LCP:', metric.value));
onFID(metric => console.log('FID:', metric.value));
onCLS(metric => console.log('CLS:', metric.value));
```

---

## Alert Configuration

### Recommended Alerts

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| High Error Rate | > 1% errors/5min | Critical | Page on-call |
| Slow Response | P95 > 2s | Warning | Investigate |
| Authentication Spike | 10x login attempts | Warning | Check for attack |
| Database Connection | > 80% pool | Warning | Scale connections |
| Storage Limit | > 80% storage | Warning | Cleanup or expand |

### Setting Up Alerts

#### Sentry Alerts
1. Go to Sentry → Alerts → Create Alert
2. Set conditions (e.g., error count > 10 in 1 hour)
3. Configure notification (email, Slack, PagerDuty)

#### Supabase Alerts
1. Go to Supabase → Settings → Alerts
2. Configure database size alerts
3. Set up email notifications

#### Cloudflare Notifications
1. Go to Cloudflare → Notifications
2. Add notification for:
   - Traffic spikes
   - Security events
   - SSL certificate expiry

---

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| SEV1 | Complete outage | 15 minutes |
| SEV2 | Major feature broken | 1 hour |
| SEV3 | Minor feature issue | 4 hours |
| SEV4 | Cosmetic/low impact | Next business day |

### Incident Workflow

1. **Detection**: Alert fires or user report
2. **Acknowledge**: Claim incident, notify stakeholders
3. **Investigate**: Check logs, identify root cause
4. **Mitigate**: Apply temporary fix if needed
5. **Resolve**: Deploy permanent fix
6. **Document**: Create post-mortem for SEV1/SEV2

### Quick Response Checklist

#### For Application Errors
- [ ] Check Sentry for error details
- [ ] Check Supabase logs for database issues
- [ ] Check Cloudflare for traffic anomalies
- [ ] Check recent deployments

#### For Performance Issues
- [ ] Check Cloudflare Web Analytics for affected pages
- [ ] Check Supabase query performance
- [ ] Check Edge Function cold starts
- [ ] Review recent code changes

#### For Authentication Issues
- [ ] Check Supabase Auth logs
- [ ] Verify no RLS policy changes
- [ ] Check session token validity
- [ ] Review auth rate limits

---

## Runbook Examples

### High Error Rate

```bash
# 1. Get recent errors from Sentry API (if configured)
# or check Sentry dashboard

# 2. Check Supabase logs
supabase functions logs sms-ingest --project-ref $PROJECT_REF

# 3. Check recent deployments
git log --oneline -10

# 4. Rollback if needed
wrangler pages deployment rollback --deployment-id=PREVIOUS_ID
```

### Database Performance

```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Check indexes usage
SELECT indexrelname, idx_scan, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Cloudflare Rollback

```bash
# List deployments
wrangler pages deployment list --project-name=ibimina-gemini

# Rollback to previous
wrangler pages deployment rollback \
  --project-name=ibimina-gemini \
  --deployment-id=PREVIOUS_ID
```

---

## Post-Mortem Template

```markdown
# Incident Post-Mortem: [Title]

**Date**: YYYY-MM-DD
**Duration**: X hours Y minutes
**Severity**: SEV1/SEV2/SEV3/SEV4

## Summary
Brief description of what happened.

## Impact
- Users affected: X
- Revenue impact: $Y
- SLA impact: Z

## Timeline
- HH:MM - Incident detected
- HH:MM - Team notified
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Incident resolved

## Root Cause
Detailed explanation of why it happened.

## Resolution
What was done to fix it.

## Action Items
- [ ] Action 1 (Owner, Due Date)
- [ ] Action 2 (Owner, Due Date)

## Lessons Learned
What we'll do differently.
```

---

## Dashboard Links

- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Supabase Dashboard**: https://app.supabase.com
- **Sentry Dashboard**: https://sentry.io
- **GitHub Actions**: https://github.com/ikanisa/ibimina_gemini/actions
