# Deployment Runbook

## Overview

This runbook provides step-by-step instructions for deploying the IBIMINA GEMINI application to production. Follow this guide for all production deployments.

## Pre-Deployment Checklist

Before starting deployment, complete the following:

- [ ] All tests passing (`npm run test && npm run e2e`)
- [ ] Code reviewed and approved
- [ ] Environment variables documented and set
- [ ] Database migrations tested in staging
- [ ] Backup created (see `docs/operations/BACKUP_PROCEDURE.md`)
- [ ] Deployment window scheduled (if required)
- [ ] Team notified of deployment
- [ ] Rollback plan prepared

## Deployment Methods

### Method 1: Automated Deployment (Recommended)

**Via GitHub Actions (CI/CD):**

1. **Merge to Main Branch:**
   ```bash
   git checkout main
   git pull origin main
   git merge feature/your-feature
   git push origin main
   ```

2. **GitHub Actions Automatically:**
   - Runs tests
   - Builds application
   - Deploys to Cloudflare Pages
   - Creates preview deployment for PRs

3. **Verify Deployment:**
   - Check GitHub Actions workflow status
   - Verify deployment in Cloudflare Dashboard
   - Test application functionality

**See:** `.github/workflows/deploy.yml`

---

### Method 2: Manual Deployment via Cloudflare Dashboard

1. **Build Locally:**
   ```bash
   npm ci
   npm run build
   ```

2. **Deploy via Dashboard:**
   - Go to Cloudflare Dashboard → Pages → Your Project
   - Click "Upload assets"
   - Select `dist` directory
   - Click "Deploy"

3. **Verify Deployment:**
   - Check deployment status
   - Test application

---

### Method 3: Manual Deployment via CLI

1. **Install Wrangler CLI:**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Build and Deploy:**
   ```bash
   npm ci
   npm run build
   wrangler pages deploy dist --project-name=ibimina-gemini
   ```

3. **Or Use Deployment Script:**
   ```bash
   ./scripts/deploy.sh production
   ```

**See:** `docs/CLOUDFLARE_DEPLOYMENT_SETUP.md`

## Deployment Steps

### Step 1: Pre-Deployment

1. **Create Backup:**
   ```bash
   ./scripts/backup.sh
   ```
   See: `docs/operations/BACKUP_PROCEDURE.md`

2. **Run Tests:**
   ```bash
   npm run test
   npm run e2e
   ```

3. **Verify Environment Variables:**
   - Check Cloudflare Dashboard → Pages → Settings → Environment Variables
   - Verify all required variables are set
   - See: `docs/ENVIRONMENT_VARIABLES.md`

4. **Check Database Migrations:**
   ```bash
   # List pending migrations
   ls -la supabase/migrations/
   
   # Apply migrations to staging first
   supabase db push --db-url $STAGING_DATABASE_URL
   ```

### Step 2: Build

1. **Install Dependencies:**
   ```bash
   npm ci
   ```

2. **Build Application:**
   ```bash
   npm run build
   ```

3. **Verify Build:**
   ```bash
   # Check dist directory exists
   ls -la dist/
   
   # Check build output
   ls -la dist/assets/
   ```

### Step 3: Deploy

**Choose deployment method (see above):**

- Automated (GitHub Actions) - Recommended
- Manual (Cloudflare Dashboard)
- Manual (CLI)

### Step 4: Post-Deployment Verification

**Immediate Checks (First 5 minutes):**

- [ ] Application loads correctly
- [ ] No console errors
- [ ] Authentication works
- [ ] Database connection successful
- [ ] Critical features functional

**Verification Commands:**
```bash
# Check application is accessible
curl -I https://ibimina-gemini.pages.dev

# Check health endpoint (if deployed)
curl https://your-project.supabase.co/functions/v1/health

# Check Sentry (if configured)
# Verify errors are being tracked
```

**Functional Tests:**

1. **Authentication:**
   - [ ] Login works
   - [ ] Logout works
   - [ ] Session persists

2. **Data Operations:**
   - [ ] Fetch transactions
   - [ ] Fetch members
   - [ ] Fetch groups
   - [ ] Create/update operations work

3. **Critical Features:**
   - [ ] Transaction processing
   - [ ] Member management
   - [ ] Group management
   - [ ] Report generation

### Step 5: Monitoring

**First Hour:**

- [ ] Monitor Sentry for errors
- [ ] Check Cloudflare Analytics for traffic
- [ ] Monitor database performance
- [ ] Check application logs

**First 24 Hours:**

- [ ] Review error rates
- [ ] Check performance metrics
- [ ] Monitor user feedback
- [ ] Review deployment metrics

## Database Migrations

### Before Deployment

1. **Test Migrations in Staging:**
   ```bash
   supabase db push --db-url $STAGING_DATABASE_URL
   ```

2. **Verify Migration Success:**
   - Check migration logs
   - Verify data integrity
   - Test affected features

### During Deployment

1. **Apply Migrations:**
   ```bash
   # Via Supabase Dashboard → SQL Editor
   # Or via Supabase CLI
   supabase db push
   ```

2. **Verify Migration:**
   ```sql
   -- Check migration was applied
   SELECT * FROM supabase_migrations.schema_migrations 
   ORDER BY version DESC LIMIT 5;
   ```

### After Deployment

1. **Verify Data Integrity:**
   - Check affected tables
   - Verify constraints
   - Test queries

2. **Monitor for Issues:**
   - Check error logs
   - Monitor query performance
   - Watch for data inconsistencies

## Rollback Procedures

**If deployment fails or issues are discovered:**

See: `docs/ROLLBACK_PROCEDURE.md`

**Quick Rollback:**
1. Cloudflare Dashboard → Pages → Deployments
2. Find last good deployment
3. Click "Rollback to this deployment"
4. Verify application works

## Environment-Specific Deployments

### Production Deployment

**Requirements:**
- All tests passing
- Code review approved
- Backup created
- Migrations tested in staging

**Steps:**
1. Merge to `main` branch
2. GitHub Actions deploys automatically
3. Verify deployment
4. Monitor for issues

### Staging Deployment

**Requirements:**
- Tests passing
- Code review approved

**Steps:**
1. Merge to `staging` branch
2. Deploy to staging environment
3. Test thoroughly
4. Promote to production if successful

### Preview Deployment

**Automatic for:**
- Pull requests
- Feature branches

**Manual:**
```bash
wrangler pages deploy dist --project-name=ibimina-gemini --env=preview
```

## Troubleshooting

### Build Failures

**Issue:** Build fails in CI/CD or locally

**Solutions:**
1. Check build logs for errors
2. Verify Node.js version (should be 20+)
3. Check for missing dependencies
4. Verify environment variables are set
5. Check for TypeScript errors: `npm run typecheck`

### Deployment Failures

**Issue:** Deployment fails in Cloudflare

**Solutions:**
1. Check Cloudflare Dashboard for error messages
2. Verify `wrangler.toml` configuration
3. Check build output directory exists
4. Verify project name matches
5. Check Cloudflare service status

### Application Not Loading

**Issue:** Application deployed but not accessible

**Solutions:**
1. Check Cloudflare Pages deployment status
2. Verify custom domain configuration (if used)
3. Check DNS settings
4. Verify SSL certificate
5. Check browser console for errors

### Environment Variables Not Working

**Issue:** Environment variables not available in app

**Solutions:**
1. Verify variables are set in Cloudflare Dashboard
2. Check variable names (must start with `VITE_`)
3. Rebuild and redeploy after adding variables
4. Check browser console for undefined values

**See:** `docs/ENVIRONMENT_VARIABLES.md`

### Database Connection Issues

**Issue:** Cannot connect to Supabase

**Solutions:**
1. Verify Supabase URL and keys are correct
2. Check Supabase service status
3. Verify database is accessible
4. Check RLS policies
5. Review connection logs

## Deployment Checklist

Use this checklist for every deployment:

### Pre-Deployment
- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Backup created
- [ ] Environment variables verified
- [ ] Database migrations tested
- [ ] Team notified

### Deployment
- [ ] Build successful
- [ ] Deployment successful
- [ ] Application accessible
- [ ] No console errors

### Post-Deployment
- [ ] Authentication works
- [ ] Database connection works
- [ ] Critical features functional
- [ ] Monitoring active
- [ ] Team notified of completion

## Emergency Procedures

### Immediate Rollback

If critical issues are discovered:

1. **Stop Deployment:**
   - If in progress, cancel deployment
   - If completed, rollback immediately

2. **Rollback:**
   - See: `docs/ROLLBACK_PROCEDURE.md`
   - Rollback to last known good deployment

3. **Notify Team:**
   - Alert team of rollback
   - Document issues discovered

4. **Investigate:**
   - Review deployment logs
   - Identify root cause
   - Create fix

5. **Re-deploy:**
   - Test fix in preview
   - Deploy fix to production

## Post-Deployment Tasks

### Immediate (First Hour)

- [ ] Monitor error rates
- [ ] Check application performance
- [ ] Verify critical features
- [ ] Review deployment logs

### Short-term (First 24 Hours)

- [ ] Review user feedback
- [ ] Check analytics
- [ ] Monitor database performance
- [ ] Review error logs

### Long-term (First Week)

- [ ] Conduct deployment review
- [ ] Update documentation if needed
- [ ] Schedule improvements
- [ ] Document lessons learned

## Related Documentation

- `docs/CLOUDFLARE_DEPLOYMENT_SETUP.md` - Cloudflare setup
- `docs/ENVIRONMENT_VARIABLES.md` - Environment variables
- `docs/ROLLBACK_PROCEDURE.md` - Rollback procedures
- `docs/operations/BACKUP_PROCEDURE.md` - Backup procedures
- `docs/operations/DISASTER_RECOVERY.md` - Disaster recovery
- `.github/workflows/deploy.yml` - CI/CD workflow
- `scripts/deploy.sh` - Deployment script

## Support

For deployment issues:
- Check Cloudflare status: https://www.cloudflarestatus.com
- Check Supabase status: https://status.supabase.com
- Review deployment logs in Cloudflare Dashboard
- Contact DevOps team

## Next Steps

1. **Review this runbook** with your team
2. **Customize** for your specific needs
3. **Test deployment** in staging environment
4. **Schedule** first production deployment
5. **Document** any custom procedures
