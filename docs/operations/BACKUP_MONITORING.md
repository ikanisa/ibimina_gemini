# Backup Monitoring

## Overview

This document describes how to monitor backup status and set up alerts for backup failures.

## Monitoring Setup

### 1. Supabase Automated Backups

**Check Backup Status:**

1. **Via Supabase Dashboard:**
   - Go to Supabase Dashboard → Database → Backups
   - View latest backup timestamp
   - Check backup status (success/failed)
   - Verify backup size

2. **Via Supabase CLI:**
   ```bash
   # Check backup status (requires Supabase CLI)
   supabase db backup list
   ```

3. **Via API (if available):**
   ```bash
   # Check project backups via Supabase API
   curl -X GET \
     "https://api.supabase.com/v1/projects/{project_ref}/backups" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

### 2. Manual Backup Monitoring

**Check Backup Files:**

```bash
# List recent backups
ls -lh backups/backup-*.sql.gz | tail -5

# Check backup age
find backups/ -name "backup-*.sql.gz" -mtime -1

# Check backup sizes (should be consistent)
du -h backups/backup-*.sql.gz | sort -h
```

## Alerting

### Alert Conditions

Set up alerts for:

1. **Backup Age:**
   - Alert if no backup in last 25 hours (daily backups should run every 24 hours)
   - Alert if no backup in last 7 days (for weekly backups)

2. **Backup Failures:**
   - Alert immediately on backup failure
   - Alert if 2+ consecutive backups fail

3. **Backup Size Anomalies:**
   - Alert if backup size changes by > 50%
   - Alert if backup size is 0 or very small

4. **Backup Integrity:**
   - Alert if backup file is corrupted
   - Alert if backup restoration test fails

### Alert Methods

#### Option 1: Supabase Dashboard Alerts

1. Go to Supabase Dashboard → Project Settings → Alerts
2. Configure backup failure alerts
3. Set notification channels (email, Slack, etc.)

#### Option 2: Custom Monitoring Script

Create a monitoring script that:
1. Checks backup status
2. Verifies backup age
3. Checks backup integrity
4. Sends alerts if issues detected

**Example Script:**

```bash
#!/bin/bash
# backup-monitor.sh

BACKUP_DIR="./backups"
MAX_AGE_HOURS=25
ALERT_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Check if backup exists in last MAX_AGE_HOURS
LATEST_BACKUP=$(find "$BACKUP_DIR" -name "backup-*.sql.gz" -type f -mtime -1 | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    # No recent backup found
    curl -X POST "$ALERT_WEBHOOK" \
        -H "Content-Type: application/json" \
        -d '{"text": "⚠️ Backup Alert: No backup found in last 25 hours!"}'
    exit 1
fi

# Check backup integrity
if ! gzip -t "$LATEST_BACKUP" 2>/dev/null; then
    curl -X POST "$ALERT_WEBHOOK" \
        -H "Content-Type: application/json" \
        -d "{\"text\": \"⚠️ Backup Alert: Backup file is corrupted: $LATEST_BACKUP\"}"
    exit 1
fi

echo "Backup monitoring: OK"
exit 0
```

#### Option 3: Cron Job Monitoring

Set up a cron job to run backup monitoring:

```bash
# Add to crontab (crontab -e)
# Check backups daily at 3 AM
0 3 * * * /path/to/backup-monitor.sh
```

### Notification Channels

**Email:**
- Send alerts to DevOps team email
- Include backup details in email

**Slack:**
- Send alerts to Slack channel
- Include backup status and details

**PagerDuty:**
- For critical backup failures
- Escalate if not acknowledged

## Weekly Backup Review

**Schedule:** Every Monday

**Checklist:**
- [ ] Verify automated backups are running
- [ ] Check backup sizes (should be consistent)
- [ ] Verify backup integrity
- [ ] Check cloud storage backups exist
- [ ] Review backup retention policy
- [ ] Test backup restoration (monthly)

## Monthly Backup Test

**Schedule:** First Monday of each month

**Procedure:**
1. Create test backup
2. Restore to test environment
3. Verify data integrity
4. Document results
5. Update procedures if needed

## Backup Metrics

Track the following metrics:

1. **Backup Success Rate:**
   - Target: 100%
   - Alert if < 95%

2. **Backup Age:**
   - Target: < 24 hours
   - Alert if > 25 hours

3. **Backup Size:**
   - Track size trends
   - Alert on significant changes

4. **Restoration Time:**
   - Track time to restore
   - Target: < 4 hours

## Files

- `scripts/backup.sh` - Backup script
- `scripts/backup-monitor.sh` - Monitoring script (to be created)
- `docs/operations/BACKUP_MONITORING.md` - This guide

## Next Steps

1. **Set up Supabase backup alerts** in dashboard
2. **Create backup monitoring script** (if needed)
3. **Set up cron job** for daily monitoring
4. **Configure notification channels** (Slack, email)
5. **Schedule first backup test** (within 30 days)
