# Rollback Procedure

## Overview

This document outlines the rollback procedures for the IBIMINA GEMINI application. Use these procedures when a deployment causes issues that require reverting to a previous version.

## When to Rollback

### ✅ Rollback Recommended

- Site is completely down after deployment
- Critical feature is broken (auth, transactions)
- Major console errors affecting all users
- Security vulnerability discovered
- Data corruption or loss
- Performance degradation (>50% slower)

### ❌ Do NOT Rollback

- Minor UI bug affecting few users
- Issue existed before deployment
- Issue is in external service (Supabase, Cloudflare)
- Issue can be fixed with hotfix (< 1 hour)
- Issue affects < 5% of users

## Rollback Methods

### Method 1: Cloudflare Pages Rollback (Fastest - < 2 minutes)

**Use when:** Frontend deployment issue

**Steps:**

1. **Access Cloudflare Dashboard:**
   - Go to: Workers & Pages → sacco → Deployments

2. **Find Last Good Deployment:**
   - Look for green checkmark (successful build)
   - Verify timestamp is before the issue
   - Check deployment message/commit

3. **Rollback:**
   - Click the "..." menu on the good deployment
   - Select "Rollback to this deployment"
   - Confirm the rollback

4. **Verify:**
   ```bash
   # Check site is accessible
   curl -I https://sacco.pages.dev
   
   # Test in browser
   # Navigate to app and verify critical flows
   ```

**Estimated Time:** 2-5 minutes

---

### Method 2: Git-Based Rollback

**Use when:** Need to revert code changes and redeploy

**Steps:**

1. **Find Last Good Commit:**
   ```bash
   git log --oneline -10
   # Identify the last good commit hash
   ```

2. **Revert Changes:**
   ```bash
   # Option A: Revert specific commit (recommended)
   git revert <bad-commit-hash>
   git push origin main
   
   # Option B: Reset to previous commit (use with caution)
   git reset --hard <good-commit-hash>
   git push --force-with-lease origin main
   ```

3. **Redeploy:**
   - GitHub Actions will automatically redeploy
   - Or manually deploy: `./scripts/deploy.sh production`

**Estimated Time:** 10-15 minutes

---

### Method 3: Database Rollback

**Use when:** Database migration caused issues

**⚠️ WARNING:** Database rollback can cause data loss. Use with extreme caution.

**Steps:**

1. **Assess Impact:**
   - Identify affected tables/data
   - Determine if data loss is acceptable
   - Check if forward fix is possible

2. **Option A: Forward Fix (Preferred):**
   ```sql
   -- Create reversal migration
   -- Example: drop newly added column
   ALTER TABLE transactions DROP COLUMN IF EXISTS new_problematic_column;
   
   -- Apply via SQL Editor or CLI
   ```

3. **Option B: Point-in-Time Recovery:**
   - Go to Supabase Dashboard → Database → Backups
   - Select point before migration
   - Restore to new database instance
   - Test restored data
   - If confirmed, swap database (requires coordination)

4. **Option C: Full Restore (Last Resort):**
   - Export current data (if salvageable)
   - Restore from last known good backup
   - Re-apply transactions from export if possible
   - Document data loss impact

**Estimated Time:** 2-8 hours (depending on method)

**See:** `docs/operations/DISASTER_RECOVERY.md`

---

### Method 4: Edge Functions Rollback

**Use when:** Edge Function deployment caused issues

**Steps:**

1. **Revert Function Code:**
   ```bash
   # Revert to previous commit
   git checkout <previous-commit> supabase/functions/
   
   # Redeploy function
   supabase functions deploy function-name
   ```

2. **Or Disable Function Temporarily:**
   - Go to Supabase Dashboard → Edge Functions
   - Select problematic function
   - Click "Disable" (if available)

**Estimated Time:** 5-10 minutes

---

## Rollback Decision Matrix

| Issue Type | Severity | Rollback Method | Estimated Time |
|------------|----------|----------------|----------------|
| Frontend broken | Critical | Cloudflare Rollback | 2-5 min |
| Database migration issue | Critical | Database Rollback | 2-8 hours |
| Edge Function issue | High | Function Rollback | 5-10 min |
| Minor UI bug | Low | Hotfix | 1-2 hours |
| Performance issue | Medium | Investigate first | Varies |

## Rollback Checklist

### Before Rollback

- [ ] Issue severity assessed
- [ ] Rollback method selected
- [ ] Team notified
- [ ] Backup verified (if database rollback)
- [ ] Rollback plan documented

### During Rollback

- [ ] Rollback procedure executed
- [ ] Status monitored
- [ ] Team updated on progress
- [ ] Issues documented

### After Rollback

- [ ] Application verified
- [ ] Critical features tested
- [ ] Team notified of completion
- [ ] Root cause investigation started
- [ ] Fix prepared for re-deployment

## Post-Rollback Actions

### Immediate (First Hour)

1. **Verify Application:**
   - [ ] Application loads correctly
   - [ ] No console errors
   - [ ] Authentication works
   - [ ] Critical features functional

2. **Monitor:**
   - [ ] Error rates (should decrease)
   - [ ] User feedback
   - [ ] Application performance

3. **Communication:**
   - [ ] Notify team of rollback
   - [ ] Update stakeholders
   - [ ] Document what went wrong

### Short-term (First 24 Hours)

1. **Investigation:**
   - [ ] Review deployment logs
   - [ ] Identify root cause
   - [ ] Document findings

2. **Fix Preparation:**
   - [ ] Create fix branch
   - [ ] Test fix in preview
   - [ ] Prepare for re-deployment

3. **Documentation:**
   - [ ] Update runbooks if needed
   - [ ] Document lessons learned
   - [ ] Schedule post-mortem (if critical)

## Prevention

### Pre-Deployment

- [ ] Test in staging environment
- [ ] Review code changes
- [ ] Verify database migrations
- [ ] Create backup
- [ ] Prepare rollback plan

### During Deployment

- [ ] Monitor deployment status
- [ ] Verify immediately after deployment
- [ ] Test critical features
- [ ] Monitor error rates

### Post-Deployment

- [ ] Monitor for first hour
- [ ] Review error logs
- [ ] Check user feedback
- [ ] Verify performance

## Emergency Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| DevOps Lead | _______ | Rollback coordination |
| Database Admin | _______ | Database rollback |
| Backend Lead | _______ | Application rollback |
| Product Owner | _______ | Rollback decision |

## Related Documentation

- `docs/deploy/DEPLOYMENT_RUNBOOK.md` - Deployment procedures
- `docs/operations/BACKUP_PROCEDURE.md` - Backup procedures
- `docs/operations/DISASTER_RECOVERY.md` - Disaster recovery
- `docs/CLOUDFLARE_DEPLOYMENT_SETUP.md` - Cloudflare setup

## Support

For rollback issues:
- Check Cloudflare status: https://www.cloudflarestatus.com
- Check Supabase status: https://status.supabase.com
- Review deployment logs
- Contact DevOps team
