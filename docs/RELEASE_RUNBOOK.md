# Production Release Runbook

**Version:** 1.0  
**Date:** 2026-01-07  
**Application:** SACCO+ Admin Portal (ibimina_gemini)

---

## 📋 Pre-Release Checklist

### 1. Code Freeze Verification

- [ ] All planned features merged to `main`
- [ ] No pending critical bug fixes
- [ ] All PRs reviewed and approved
- [ ] Version number updated (if applicable)

### 2. Staging Verification

- [ ] Staging environment mirrors production configuration
- [ ] All automated tests pass on staging
- [ ] UAT completed and signed off
- [ ] Performance benchmarks meet targets
- [ ] Security scan completed (no critical issues)

### 3. Database Readiness

- [ ] All migrations applied to staging successfully
- [ ] Migrations tested for rollback capability
- [ ] Database backup scheduled before deployment
- [ ] Point-in-time recovery enabled in Supabase

### 4. Environment Variables

| Variable | Production Value Set | Verified |
|----------|---------------------|----------|
| `VITE_SUPABASE_URL` | ⬜ | ⬜ |
| `VITE_SUPABASE_ANON_KEY` | ⬜ | ⬜ |
| `SUPABASE_SERVICE_ROLE_KEY` (Edge Functions) | ⬜ | ⬜ |
| `OPENAI_API_KEY` (Edge Functions) | ⬜ | ⬜ |
| `GEMINI_API_KEY` (Edge Functions) | ⬜ | ⬜ |
| `INGEST_API_KEY` (Edge Functions) | ⬜ | ⬜ |
| `SENTRY_DSN` (optional) | ⬜ | ⬜ |

**⚠️ CRITICAL:** Ensure `VITE_USE_MOCK_DATA` is NOT set or is `false` in production.

---

## 🚀 Deployment Steps

### Phase 1: Database Migration (Supabase)

**Estimated Time:** 10-15 minutes

#### 1.1 Pre-Migration Backup

```bash
# Note: Supabase handles backups automatically, but verify:
# Go to Supabase Dashboard → Database → Backups
# Confirm latest backup exists or trigger manual backup
```

#### 1.2 Apply Migrations

**Option A: Via Supabase CLI (Recommended)**

```bash
# From project root
cd /path/to/ibimina_gemini

# Login to Supabase (if not already)
supabase login

# Link to production project
supabase link --project-ref wadhydemushqqtcrrlwm

# Apply migrations
supabase db push

# Verify migration status
supabase migration list
```

**Option B: Via SQL Editor**

1. Go to Supabase Dashboard → SQL Editor
2. Copy content from each migration file in order:
   - `20260107000000_redesign_consolidated_schema.sql`
   - `20260107100000_settings_module.sql`
   - `20260107200000_dashboard_module.sql`
   - ... (all migrations in sequence)
   - `20260107900000_phase9_security_polish.sql`
3. Execute each migration and verify success

#### 1.3 Verify Migration Success

```sql
-- Run in Supabase SQL Editor
SELECT name, executed_at 
FROM supabase_migrations.schema_migrations 
ORDER BY executed_at DESC 
LIMIT 10;
```

Expected: All Phase 1-10 migrations listed.

---

### Phase 2: Edge Functions Deployment

**Estimated Time:** 5-10 minutes

#### 2.1 Deploy Functions

```bash
# Deploy all edge functions
supabase functions deploy

# Or deploy individually
supabase functions deploy sms-ingest
supabase functions deploy parse-momo-sms
supabase functions deploy staff-invite
supabase functions deploy bulk-import-groups
supabase functions deploy bulk-import-members
```

#### 2.2 Set Function Secrets

```bash
# Set production secrets for edge functions
supabase secrets set OPENAI_API_KEY=sk-proj-xxx
supabase secrets set GEMINI_API_KEY=AIzaxxx
supabase secrets set INGEST_API_KEY=your-secure-ingest-key

# Verify secrets are set
supabase secrets list
```

#### 2.3 Verify Functions

```bash
# Test SMS ingest endpoint (use a test payload)
curl -X POST https://wadhydemushqqtcrrlwm.supabase.co/functions/v1/sms-ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-ingest-api-key" \
  -d '{"device_identifier":"test","sender_phone":"MoMo","sms_text":"Test SMS","received_at":"2026-01-07T12:00:00Z"}'

# Expected: {"success":true,...} or appropriate error
```

---

### Phase 3: Frontend Deployment (Cloudflare Pages)

**Estimated Time:** 5-10 minutes

#### 3.1 Pre-Deployment Build Test

```bash
# Local build test
npm run build

# Verify build output
ls -la dist/
# Should see: index.html, assets/, _redirects
```

#### 3.2 Deploy to Cloudflare

**Option A: Git-based Deployment (Recommended)**

```bash
# Push to main branch triggers automatic deployment
git push origin main

# Monitor deployment in Cloudflare Dashboard
# Pages → ibimina-gemini → Deployments
```

**Option B: Direct Upload**

```bash
# Install Wrangler if not present
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy dist --project-name=ibimina-gemini
```

#### 3.3 Verify Deployment

1. Visit production URL
2. Check routes load (no 404 on direct URL access)
3. Verify login works
4. Check console for JavaScript errors

---

### Phase 4: Smoke Tests

**Estimated Time:** 5-10 minutes

#### 4.1 Critical Route Tests

| Route | Expected | Status |
|-------|----------|--------|
| `/` | Login page or redirect to dashboard | ⬜ |
| `/dashboard` | Dashboard with KPIs | ⬜ |
| `/transactions` | Transaction list | ⬜ |
| `/groups` | Groups list | ⬜ |
| `/members` | Members list | ⬜ |
| `/reconciliation` | Reconciliation tabs | ⬜ |
| `/reports` | Reports page | ⬜ |
| `/settings` | Settings home | ⬜ |

#### 4.2 Authentication Test

1. ⬜ Login with valid credentials
2. ⬜ Session persists after page refresh
3. ⬜ Logout works correctly
4. ⬜ Protected routes redirect when logged out

#### 4.3 Data Test

1. ⬜ Dashboard loads real data (not mock)
2. ⬜ Transactions show institution-scoped data
3. ⬜ Allocating a transaction works
4. ⬜ Audit log shows new events

#### 4.4 SMS Pipeline Test (if applicable)

```bash
# Send test SMS to ingest endpoint
# Replace with actual production ingest key
curl -X POST https://wadhydemushqqtcrrlwm.supabase.co/functions/v1/sms-ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: PRODUCTION_INGEST_KEY" \
  -d '{
    "device_identifier":"prod-device-001",
    "sender_phone":"MoMo",
    "sms_text":"You have received 5000 RWF from 0788000000...",
    "received_at":"2026-01-07T12:00:00Z"
  }'
```

---

## 🔙 Rollback Procedures

### Rollback Level 1: Frontend Only

**Use when:** Frontend issues, no database impact

```bash
# In Cloudflare Pages:
# 1. Go to Deployments
# 2. Find previous working deployment
# 3. Click "..." → "Rollback to this deployment"

# Or via CLI:
# wrangler pages deploy dist --project-name=ibimina-gemini --commit-hash=PREVIOUS_HASH
```

### Rollback Level 2: Edge Functions

**Use when:** Edge function issues, database unchanged

```bash
# Rollback to previous function version
# Option 1: Redeploy from previous commit
git checkout PREVIOUS_COMMIT
supabase functions deploy
git checkout main

# Option 2: Disable problematic function temporarily
# In Supabase Dashboard → Edge Functions → [Function] → Disable
```

### Rollback Level 3: Database (Use with Extreme Caution)

**Use when:** Critical database issues, data integrity at risk

#### Option A: Point-in-Time Recovery (PITR)

1. Go to Supabase Dashboard → Database → Backups
2. Select point before migration
3. Restore to new database instance
4. Test restored data
5. If confirmed, swap database (requires coordination)

#### Option B: Forward Fix Migration

**Preferred approach for non-critical issues:**

```sql
-- Create reversal migration
-- Example: drop newly added column
ALTER TABLE transactions DROP COLUMN IF EXISTS new_problematic_column;

-- Apply via SQL Editor or CLI
```

#### Option C: Full Restore (Last Resort)

1. Export current data (if salvageable)
2. Restore from last known good backup
3. Re-apply transactions from export if possible
4. Document data loss impact

---

## 📊 Post-Deployment Monitoring

### First Hour

- [ ] Monitor error rates in browser console
- [ ] Check Supabase logs for errors
- [ ] Monitor Edge Function invocation logs
- [ ] Watch for user-reported issues

### First 24 Hours

- [ ] Review Sentry error reports (if configured)
- [ ] Check database performance metrics
- [ ] Review audit log for anomalies
- [ ] Confirm SMS ingestion working (if applicable)

### Monitoring Checklist

| Metric | Expected | Actual | Status |
|--------|----------|--------|--------|
| Dashboard load time | < 3s | | ⬜ |
| Transaction list load | < 2s | | ⬜ |
| Error rate | < 1% | | ⬜ |
| Edge Function errors | 0 | | ⬜ |
| Failed SMS parses | < 5% | | ⬜ |

---

## 🔐 Security Post-Deployment

### RLS Verification

```sql
-- Run as authenticated user (not service role)
-- Should only return user's institution data
SELECT COUNT(*) FROM transactions;
SELECT COUNT(*) FROM members;
SELECT COUNT(*) FROM groups;
```

### Secret Rotation (If Needed)

1. Generate new API keys
2. Update in Supabase secrets
3. Update SMS gateway configuration (if applicable)
4. Verify services still work

---

## 📞 Incident Response

### Severity Levels

| Level | Definition | Response Time |
|-------|------------|---------------|
| P1 - Critical | System down, data loss | Immediate |
| P2 - Major | Core feature broken | 1 hour |
| P3 - Minor | Non-critical issue | 4 hours |
| P4 - Low | Cosmetic issue | 24 hours |

### Escalation Contacts

| Role | Name | Contact |
|------|------|---------|
| Technical Lead | | |
| DevOps | | |
| Product Owner | | |
| Database Admin | | |

### Incident Procedure

1. **Assess**: Determine severity and impact
2. **Communicate**: Notify stakeholders
3. **Mitigate**: Apply temporary fix or rollback
4. **Investigate**: Find root cause
5. **Resolve**: Apply permanent fix
6. **Review**: Document and learn

---

## ✅ Release Sign-Off

### Deployment Completed

| Step | Completed | By | Time |
|------|-----------|----|----|
| Database migration | ⬜ | | |
| Edge functions deployed | ⬜ | | |
| Frontend deployed | ⬜ | | |
| Smoke tests passed | ⬜ | | |
| Monitoring confirmed | ⬜ | | |

### Final Approval

**Deployment Status:** ⬜ Success / ⬜ Partial / ⬜ Failed

**Notes:**

---

**Deployed by:** ________________

**Date/Time:** ________________

**Verified by:** ________________

---

## 📝 Appendix

### Migration Order Reference

```
1. 20260107000000_redesign_consolidated_schema.sql
2. 20260107100000_settings_module.sql
3. 20260107200000_dashboard_module.sql
4. 20260107300000_transactions_module.sql (if exists)
5. 20260107400000_reconciliation_module.sql
6. 20260107500000_groups_members_module.sql
7. 20260107600000_reports_module.sql
8. 20260107700000_institutions_staff_module.sql
9. 20260107800000_sms_pipeline_module.sql
10. 20260107900000_phase9_security_polish.sql
```

### Environment URLs

| Environment | URL | Supabase Project |
|-------------|-----|------------------|
| Production | https://your-domain.com | wadhydemushqqtcrrlwm |
| Staging | https://staging.your-domain.com | (staging project ref) |
| Local | http://localhost:5173 | local |

### Useful Commands

```bash
# Check Supabase status
supabase status

# View Edge Function logs
supabase functions logs sms-ingest

# Run E2E tests against production (carefully!)
E2E_BASE_URL=https://your-domain.com npm run e2e -- --grep "smoke"

# Build production locally
npm run build && npm run preview
```

