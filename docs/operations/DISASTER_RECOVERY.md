# Disaster Recovery Plan

## Overview

This document outlines the disaster recovery procedures for the IBIMINA GEMINI system. It covers recovery scenarios, procedures, and testing requirements.

## Recovery Objectives

### Recovery Time Objective (RTO)

**Target:** 4 hours  
**Maximum Acceptable:** 24 hours

**Definition:** Maximum acceptable time to restore service after a disaster.

### Recovery Point Objective (RPO)

**Target:** 1 hour  
**Maximum Acceptable:** 24 hours

**Definition:** Maximum acceptable data loss (time between last backup and disaster).

## Disaster Scenarios

### Scenario 1: Database Corruption

**Symptoms:**
- Database queries fail
- Data inconsistencies
- Application errors

**Recovery Procedure:**
1. **Immediate Actions:**
   - Put application in maintenance mode
   - Stop accepting new transactions
   - Document error messages

2. **Assessment:**
   - Identify affected tables/data
   - Determine corruption extent
   - Check backup availability

3. **Recovery:**
   - Restore from most recent backup
   - Verify data integrity
   - Test critical functions
   - Resume service

**Estimated Recovery Time:** 2-4 hours

---

### Scenario 2: Complete Database Loss

**Symptoms:**
- Database unreachable
- Connection errors
- Supabase dashboard shows database unavailable

**Recovery Procedure:**
1. **Immediate Actions:**
   - Put application in maintenance mode
   - Notify stakeholders
   - Contact Supabase support

2. **Assessment:**
   - Verify backup availability
   - Check Supabase status page
   - Determine if Supabase-side issue

3. **Recovery:**
   - Restore from most recent backup
   - Re-apply any migrations since backup
   - Verify all data restored
   - Test all critical functions
   - Resume service

**Estimated Recovery Time:** 4-8 hours

---

### Scenario 3: Data Deletion (Accidental or Malicious)

**Symptoms:**
- Missing data
- Deleted records
- Audit logs show deletion

**Recovery Procedure:**
1. **Immediate Actions:**
   - Stop all database writes
   - Put application in read-only mode
   - Document what was deleted

2. **Assessment:**
   - Identify deleted data
   - Check audit logs for deletion details
   - Determine deletion scope

3. **Recovery:**
   - Restore affected tables from backup
   - Merge with current data (if partial deletion)
   - Verify data integrity
   - Re-enable writes
   - Resume service

**Estimated Recovery Time:** 2-6 hours

---

### Scenario 4: Application Deployment Failure

**Symptoms:**
- Application not loading
- Build failures
- Deployment errors

**Recovery Procedure:**
1. **Immediate Actions:**
   - Rollback to previous deployment
   - See: `docs/ROLLBACK_PROCEDURE.md`

2. **Assessment:**
   - Review deployment logs
   - Identify failure cause
   - Check environment variables

3. **Recovery:**
   - Fix deployment issues
   - Test in preview environment
   - Redeploy to production

**Estimated Recovery Time:** 15 minutes - 2 hours

---

### Scenario 5: Supabase Service Outage

**Symptoms:**
- Cannot connect to Supabase
- Supabase status page shows outage
- All database operations fail

**Recovery Procedure:**
1. **Immediate Actions:**
   - Put application in maintenance mode
   - Monitor Supabase status page
   - Notify stakeholders

2. **Assessment:**
   - Check Supabase status: https://status.supabase.com
   - Verify if regional or global outage
   - Estimate recovery time from Supabase

3. **Recovery:**
   - Wait for Supabase to restore service
   - Verify database connectivity
   - Check data integrity
   - Resume service

**Estimated Recovery Time:** Depends on Supabase (typically 1-4 hours)

---

### Scenario 6: Cloudflare Service Outage

**Symptoms:**
- Application not accessible
   - Cloudflare status page shows outage
   - DNS resolution fails

**Recovery Procedure:**
1. **Immediate Actions:**
   - Check Cloudflare status: https://www.cloudflarestatus.com
   - Verify if regional or global outage
   - Notify stakeholders

2. **Assessment:**
   - Determine outage scope
   - Check if alternative CDN available
   - Estimate recovery time

3. **Recovery:**
   - Wait for Cloudflare to restore service
   - Verify application accessibility
   - Test all critical functions
   - Resume service

**Estimated Recovery Time:** Depends on Cloudflare (typically 30 minutes - 2 hours)

---

## Recovery Procedures

### Database Restoration from Backup

#### Option 1: Point-in-Time Recovery (PITR) - Supabase

**Use when:** Need to restore to specific point in time

1. **Access Supabase Dashboard:**
   - Go to Database → Backups
   - Select backup point
   - Click "Restore"

2. **Restore Process:**
   - Supabase creates new database instance
   - Restores to selected point in time
   - Provides new connection details

3. **Post-Restore:**
   - Update connection strings
   - Verify data integrity
   - Test critical functions
   - Swap to restored database

#### Option 2: Manual SQL Restore

**Use when:** Have SQL backup file

```bash
# Restore from SQL backup
psql "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres" < backup-20260115.sql

# Or using Supabase CLI
supabase db reset
supabase db push backup-20260115.sql
```

#### Option 3: Table-Level Restore

**Use when:** Only specific tables affected

```sql
-- Restore specific table from backup
-- 1. Export table from backup
pg_dump -t table_name backup.sql > table_backup.sql

-- 2. Restore table
psql database < table_backup.sql
```

### Application Rollback

**See:** `docs/ROLLBACK_PROCEDURE.md`

**Quick Rollback:**
1. Cloudflare Dashboard → Pages → Deployments
2. Find last good deployment
3. Click "Rollback to this deployment"
4. Verify application works

### Environment Variable Restoration

1. **Access Cloudflare Dashboard:**
   - Go to Pages → Your Project → Settings → Environment Variables
   - Restore from documented backup (see BACKUP_PROCEDURE.md)

2. **Access Supabase Dashboard:**
   - Go to Project Settings → API
   - Restore API keys from backup

3. **Update Application:**
   - Redeploy after restoring variables
   - Verify environment variables are set

## Recovery Testing

### Monthly Recovery Test

**Schedule:** First Monday of each month

**Test Procedure:**
1. **Create Test Backup:**
   ```bash
   ./scripts/backup.sh test-backup-$(date +%Y%m%d).sql
   ```

2. **Restore to Test Environment:**
   - Use staging Supabase project
   - Restore backup
   - Verify data integrity

3. **Test Critical Functions:**
   - User authentication
   - Transaction processing
   - Data queries
   - Report generation

4. **Document Results:**
   - Recovery time
   - Data integrity status
   - Issues encountered
   - Improvements needed

### Quarterly Full Disaster Recovery Drill

**Schedule:** Quarterly

**Test Scenarios:**
1. Complete database loss
2. Application deployment failure
3. Service outage simulation

**Procedure:**
1. Simulate disaster scenario
2. Execute recovery procedures
3. Measure recovery time
4. Document lessons learned
5. Update recovery procedures

## Communication Plan

### Internal Communication

**During Disaster:**
1. **Immediate:** Notify DevOps team via Slack/Phone
2. **Within 1 hour:** Status update to stakeholders
3. **Every 2 hours:** Progress update until resolved

**After Recovery:**
1. **Within 24 hours:** Post-mortem report
2. **Within 1 week:** Updated procedures (if needed)

### External Communication

**If User-Facing Impact:**
1. **Immediate:** Maintenance mode message
2. **Updates:** Regular status updates
3. **Resolution:** Notification when service restored

## Recovery Checklist

### Pre-Recovery

- [ ] Document disaster scenario
- [ ] Identify affected systems
- [ ] Verify backup availability
- [ ] Notify stakeholders
- [ ] Put application in maintenance mode

### During Recovery

- [ ] Follow recovery procedure
- [ ] Document recovery steps
- [ ] Verify data integrity
- [ ] Test critical functions
- [ ] Monitor for errors

### Post-Recovery

- [ ] Verify all systems operational
- [ ] Test all critical functions
- [ ] Remove maintenance mode
- [ ] Notify stakeholders of resolution
- [ ] Document recovery time
- [ ] Schedule post-mortem

## Prevention Measures

### Regular Backups

- Automated daily backups (Supabase)
- Manual weekly backups
- Pre-migration backups

### Monitoring

- Database health monitoring
- Application uptime monitoring
- Backup verification alerts

### Testing

- Monthly recovery tests
- Quarterly disaster drills
- Regular backup verification

### Documentation

- Keep procedures up to date
- Document all changes
- Maintain recovery runbooks

## Emergency Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| DevOps Lead | _______ | Overall recovery coordination |
| Database Admin | _______ | Database restoration |
| Backend Lead | _______ | Application recovery |
| Product Owner | _______ | Stakeholder communication |

## External Support

- **Supabase Support:** https://supabase.com/support
- **Cloudflare Support:** https://support.cloudflare.com
- **Sentry Support:** https://sentry.io/support

## Files

- `docs/operations/BACKUP_PROCEDURE.md` - Backup procedures
- `docs/operations/DISASTER_RECOVERY.md` - This guide
- `docs/ROLLBACK_PROCEDURE.md` - Application rollback
- `scripts/backup.sh` - Backup script

## Next Steps

1. **Review and customize** this plan for your organization
2. **Fill in emergency contacts** table
3. **Schedule first recovery test** (within 30 days)
4. **Set up backup monitoring** alerts
5. **Document backup locations** and access procedures
6. **Train team** on recovery procedures
