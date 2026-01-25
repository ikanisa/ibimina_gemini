# Uptime Monitoring Setup Guide

## Overview

Uptime monitoring has been implemented to track system availability and detect outages. This includes a health check endpoint and integration with monitoring services.

## Health Check Endpoint

### Endpoint Details

- **URL**: `https://your-project.supabase.co/functions/v1/health`
- **Method**: GET
- **Authentication**: None required (public endpoint)
- **Response Time**: < 500ms (target)

### Response Format

**Healthy (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-15T10:00:00Z",
  "version": "1.0.0",
  "checks": {
    "database": "ok",
    "edge_function": "ok"
  },
  "responseTime": 45
}
```

**Degraded (200 OK):**
```json
{
  "status": "degraded",
  "timestamp": "2026-01-15T10:00:00Z",
  "version": "1.0.0",
  "checks": {
    "database": "degraded",
    "edge_function": "ok"
  },
  "responseTime": 120
}
```

**Unhealthy (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "timestamp": "2026-01-15T10:00:00Z",
  "version": "1.0.0",
  "checks": {
    "database": "error",
    "edge_function": "ok"
  },
  "responseTime": 5000
}
```

## Monitoring Services

### Option 1: UptimeRobot (Recommended - Free Tier)

1. **Sign up**: https://uptimerobot.com
2. **Create Monitor**:
   - **Type**: HTTP(s)
   - **URL**: `https://your-project.supabase.co/functions/v1/health`
   - **Interval**: 5 minutes
   - **Alert Contacts**: Add email/SMS
3. **Configure Alerts**:
   - Alert when down for 2 consecutive checks
   - Alert when back up

**Free Tier Limits:**
- 50 monitors
- 5-minute check interval
- Email/SMS alerts

### Option 2: Better Uptime

1. **Sign up**: https://betteruptime.com
2. **Create Monitor**:
   - **URL**: `https://your-project.supabase.co/functions/v1/health`
   - **Interval**: 1 minute (paid) or 5 minutes (free)
   - **Regions**: Multiple regions for redundancy
3. **Configure Alerts**:
   - Email, SMS, Slack, PagerDuty
   - Incident management

**Free Tier:**
- 10 monitors
- 5-minute check interval
- Email alerts

### Option 3: Pingdom

1. **Sign up**: https://www.pingdom.com
2. **Create HTTP Check**:
   - **URL**: Health check endpoint
   - **Interval**: 1-5 minutes
   - **Locations**: Multiple check locations
3. **Configure Alerts**:
   - Email, SMS, webhooks

### Option 4: Cloudflare Health Checks (If Using Cloudflare)

1. Go to Cloudflare Dashboard → Health Checks
2. Create new health check:
   - **Name**: SACCO+ Admin Portal
   - **URL**: Health check endpoint
   - **Interval**: 1 minute
   - **Regions**: All regions
3. Configure notifications:
   - Email alerts
   - Webhook to Slack/Discord

## Recommended Setup

### Primary Monitor (UptimeRobot)

- **URL**: Health check endpoint
- **Interval**: 5 minutes
- **Timeout**: 30 seconds
- **Alert**: After 2 consecutive failures
- **Contacts**: Email + SMS

### Secondary Monitor (Better Uptime)

- **URL**: Health check endpoint
- **Interval**: 5 minutes
- **Regions**: US, EU, Asia
- **Alert**: After 1 failure
- **Contacts**: Slack channel

## Health Check Checks

### Current Checks

1. **Database Connectivity**
   - Queries `institutions` table
   - Verifies Supabase connection
   - Status: `ok` | `degraded` | `error`

2. **Edge Function Availability**
   - Always `ok` if function responds
   - Status: `ok` | `error`

### Future Checks (Can be added)

- Redis connectivity (if using Upstash)
- External API health (if applicable)
- Disk space (if applicable)
- Memory usage (if applicable)

## Testing

### Manual Test

```bash
# Test health endpoint
curl https://your-project.supabase.co/functions/v1/health

# Expected: 200 OK with healthy status
```

### Automated Test

```bash
# Test with timeout
curl --max-time 10 https://your-project.supabase.co/functions/v1/health

# Test response time
time curl https://your-project.supabase.co/functions/v1/health
```

## Alert Configuration

### Recommended Alert Rules

1. **Critical Alert** (Immediate):
   - Trigger: Health check fails 2 times in a row
   - Action: Email + SMS to on-call engineer
   - Escalation: If not resolved in 15 minutes, notify manager

2. **Warning Alert**:
   - Trigger: Response time > 1 second
   - Action: Email to team
   - Purpose: Early warning of performance issues

3. **Recovery Alert**:
   - Trigger: System recovers after outage
   - Action: Email notification
   - Purpose: Confirm system is back online

## Monitoring Dashboard

### Key Metrics to Track

1. **Uptime Percentage**: Target 99.9% (8.76 hours downtime/year)
2. **Average Response Time**: Target < 200ms
3. **Error Rate**: Target < 0.1%
4. **Incident Count**: Track number of outages

### Weekly Review

Every Monday, review:
- [ ] Uptime percentage for previous week
- [ ] Number of incidents
- [ ] Average response time
- [ ] Any recurring issues

## Integration with Other Services

### Sentry Integration

Health check failures can trigger Sentry alerts:

```typescript
// In health check function
if (overallStatus === 'unhealthy') {
  // Log to Sentry
  captureMessage('Health check failed', 'error');
}
```

### Slack Integration

Set up Slack webhook for alerts:

1. Create Slack webhook URL
2. Configure in monitoring service
3. Receive real-time alerts in Slack channel

### PagerDuty Integration

For critical systems:

1. Create PagerDuty service
2. Configure escalation policies
3. Integrate with monitoring service
4. Automatic on-call rotation

## Files

- `supabase/functions/health/index.ts` - Health check endpoint
- `docs/UPTIME_MONITORING_SETUP.md` - This guide

## Next Steps

1. **Deploy health check endpoint** to Supabase
2. **Set up UptimeRobot** monitor
3. **Configure alerts** (email, SMS, Slack)
4. **Test monitoring** by temporarily breaking health check
5. **Set up dashboard** for uptime metrics
6. **Document on-call procedures** for alerts

## Cost Considerations

- **UptimeRobot**: Free (50 monitors, 5-min interval)
- **Better Uptime**: Free (10 monitors) or $10/month (unlimited)
- **Pingdom**: $10/month (basic plan)
- **Cloudflare Health Checks**: Included with Pro plan ($20/month)

For most use cases, UptimeRobot free tier is sufficient.
