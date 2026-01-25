# Backup Procedure

## Overview

This document outlines the backup strategy and procedures for the IBIMINA GEMINI system. Backups are critical for data protection and disaster recovery.

## Backup Strategy

### Automated Backups (Supabase)

**Frequency:** Daily  
**Retention:** 7 days (Supabase Pro), 30 days (Supabase Team)  
**Storage:** Supabase managed storage  
**Type:** Point-in-Time Recovery (PITR)

**Configuration:**
1. Go to Supabase Dashboard → Project Settings → Database
2. Verify "Daily Backups" is enabled
3. Check backup schedule (typically runs at 2 AM UTC)
4. Verify retention period

**What's Backed Up:**
- All database tables
- All database schemas
- All RLS policies
- All functions and triggers
- All indexes
- All sequences

**What's NOT Backed Up:**
- Edge Functions code (stored in Git)
- Environment variables (stored in Supabase Dashboard)
- File storage (if using Supabase Storage - configure separately)

### Manual Backups

**Frequency:** Before major migrations or deployments  
**Retention:** 30 days  
**Storage:** Secure cloud storage (AWS S3, Google Cloud Storage, etc.)

**When to Create Manual Backup:**
- Before database migrations
- Before major deployments
- Before schema changes
- Weekly (recommended for critical data)

## Backup Procedures

### 1. Supabase Automated Backup Verification

**Check Backup Status:**
1. Go to Supabase Dashboard → Database → Backups
2. Verify latest backup exists and is successful
3. Check backup size and timestamp
4. Verify backup is within last 24 hours

**Verify Backup Integrity:**
```sql
-- Check database size (should match backup size approximately)
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Check table counts
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

### 2. Manual Database Backup

**Using Supabase CLI:**

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Create backup
supabase db dump -f backup-$(date +%Y%m%d-%H%M%S).sql
```

**Using pg_dump (Direct Database Connection):**

```bash
# Get connection string from Supabase Dashboard → Settings → Database
# Format: postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres

# Create backup
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  -f backup-$(date +%Y%m%d-%H%M%S).sql

# Compress backup
gzip backup-$(date +%Y%m%d-%H%M%S).sql
```

**Using Backup Script:**

```bash
# Run automated backup script
./scripts/backup.sh

# Or with custom output directory
./scripts/backup.sh /path/to/backup/directory
```

### 3. Edge Functions Backup

Edge Functions are stored in Git, but backup deployment configuration:

```bash
# Backup Edge Functions code
git archive --format=tar.gz --output=edge-functions-$(date +%Y%m%d).tar.gz HEAD supabase/functions/

# Backup Edge Functions secrets (document in secure location)
# Supabase Dashboard → Edge Functions → [Function] → Settings → Secrets
```

### 4. Environment Variables Backup

**Document in secure location (password manager, encrypted file):**

1. Supabase Project Settings:
   - Database password
   - API keys (anon, service_role)
   - JWT secret

2. Cloudflare Pages:
   - Environment variables
   - API tokens

3. External Services:
   - Sentry DSN
   - Redis credentials (if using Upstash)
   - SMS gateway credentials

**Template for Environment Variables Backup:**

```markdown
# Environment Variables Backup
Date: YYYY-MM-DD

## Supabase
- Project URL: https://xxx.supabase.co
- Database Password: [stored in password manager]
- Anon Key: [stored in password manager]
- Service Role Key: [stored in password manager]

## Cloudflare
- Account ID: [stored in password manager]
- API Token: [stored in password manager]

## External Services
- Sentry DSN: [stored in password manager]
- Redis URL: [stored in password manager]
```

## Backup Storage

### Local Storage (Temporary)

- Store backups locally for immediate access
- Encrypt sensitive backups
- Delete after uploading to cloud storage

### Cloud Storage (Long-term)

**Recommended Services:**
- AWS S3 (with versioning)
- Google Cloud Storage
- Azure Blob Storage
- Backblaze B2

**Storage Requirements:**
- Encrypted at rest
- Versioning enabled
- Lifecycle policies (delete after 30 days)
- Access logging enabled

**Upload to Cloud Storage:**

```bash
# Example: Upload to AWS S3
aws s3 cp backup-20260115.sql.gz s3://your-backup-bucket/database/

# Example: Upload to Google Cloud Storage
gsutil cp backup-20260115.sql.gz gs://your-backup-bucket/database/
```

## Backup Monitoring

### Automated Monitoring

**Set up alerts for:**
1. Backup failures (Supabase Dashboard → Alerts)
2. Backup age (alert if no backup in 25 hours)
3. Backup size anomalies (significant size changes)

### Manual Verification

**Weekly Checklist:**
- [ ] Verify automated backups are running
- [ ] Check backup sizes (should be consistent)
- [ ] Test backup restoration (monthly)
- [ ] Verify cloud storage backups exist
- [ ] Review backup retention policy

## Backup Retention Policy

| Backup Type | Retention Period | Storage Location |
|-------------|------------------|------------------|
| Supabase Automated | 7-30 days | Supabase managed |
| Manual Pre-Migration | 30 days | Cloud storage |
| Weekly Manual | 30 days | Cloud storage |
| Monthly Archive | 1 year | Cloud storage (cold storage) |

## Backup Restoration

See `docs/operations/DISASTER_RECOVERY.md` for detailed restoration procedures.

## Security Considerations

1. **Encryption:**
   - Encrypt backups at rest
   - Use encrypted connections for backup transfer
   - Store encryption keys securely

2. **Access Control:**
   - Limit backup access to authorized personnel
   - Use role-based access control
   - Audit backup access logs

3. **Compliance:**
   - Ensure backups comply with data protection regulations
   - Encrypt PII in backups
   - Document backup procedures for audits

## Troubleshooting

### Backup Fails

**Issue:** Supabase automated backup fails

**Solutions:**
1. Check Supabase status page
2. Verify database is accessible
3. Check database size (may exceed limits)
4. Contact Supabase support

### Backup Too Large

**Issue:** Backup file is very large

**Solutions:**
1. Compress backup: `gzip backup.sql`
2. Use incremental backups (pg_basebackup)
3. Exclude large tables if not critical
4. Consider database partitioning

### Backup Restoration Fails

**Issue:** Cannot restore from backup

**Solutions:**
1. Verify backup file integrity: `pg_restore --list backup.sql`
2. Check database version compatibility
3. Verify sufficient disk space
4. Check database permissions

## Files

- `scripts/backup.sh` - Automated backup script
- `docs/operations/BACKUP_PROCEDURE.md` - This guide
- `docs/operations/DISASTER_RECOVERY.md` - Recovery procedures

## Next Steps

1. **Verify Supabase automated backups** are enabled
2. **Set up manual backup schedule** (weekly)
3. **Configure cloud storage** for backup storage
4. **Set up backup monitoring** and alerts
5. **Test backup restoration** (monthly)
6. **Document backup locations** and access procedures
