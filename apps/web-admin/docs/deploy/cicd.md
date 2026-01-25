# CI/CD Pipeline Documentation

## Overview

This document describes the CI/CD pipeline for the SACCO+ Admin Portal deployed on Cloudflare Pages.

## Deployment Strategy

### Production Branch
**Branch:** `main`

All merges to `main` trigger automatic deployment to production.

### Preview Deployments
**Strategy:** Automatic preview deployments for all pull requests

- Every PR gets a unique preview URL
- Preview uses preview environment variables
- QA can test before merging to main

## CI Pipeline (GitHub Actions)

### Workflow: `ci.yml`

**Triggers:**
- Pull requests to `main`
- Pushes to `main`

**Steps:**
1. ✅ Checkout code
2. ✅ Setup Node.js (from `.nvmrc`)
3. ✅ Install dependencies (`npm ci` - uses lockfile)
4. ✅ Lint (if configured)
5. ✅ Typecheck (`npm run typecheck`)
6. ✅ Build (`npm run build`)
7. ✅ Verify build output

### Required GitHub Secrets

For CI to build successfully, add these secrets (optional, uses placeholders if missing):

| Secret | Required | Purpose |
|--------|----------|---------|
| `VITE_SUPABASE_URL` | No | For build verification (uses placeholder if missing) |
| `VITE_SUPABASE_ANON_KEY` | No | For build verification (uses placeholder if missing) |

**Note:** These are optional because the build will work with placeholder values. The actual values are set in Cloudflare Pages.

## Cloudflare Pages Deployment

### Automatic Deployment

**Trigger:** Push to `main` branch

**Process:**
1. Cloudflare detects push to `main`
2. Runs build with production environment variables
3. Deploys to `sacco1.pages.dev`
4. Updates service worker (PWA)

### Build Configuration

**Framework:** Vite (or None)
**Build Command:** `npm run build`
**Output Directory:** `dist`
**Node Version:** 18 (from `.nvmrc`)

### Environment Variables

Set in Cloudflare Pages Dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_USE_MOCK_DATA=false`
- `NODE_VERSION=18`

## Preview Deployments

### Automatic Previews

Every pull request automatically gets:
- Unique preview URL
- Preview environment variables
- Full build and deployment

### Preview Environment Variables

Set in Cloudflare Pages → Settings → Environment Variables → Preview:

```bash
VITE_SUPABASE_URL=https://preview-project.supabase.co
VITE_SUPABASE_ANON_KEY=preview-anon-key
VITE_USE_MOCK_DATA=false
```

### Using Previews

1. Create a pull request
2. Wait for preview deployment (check PR comments)
3. Test on preview URL
4. Get approval
5. Merge to `main` → Production deployment

## Deployment Gates

### Pre-Merge Checks (CI)

- ✅ Lint passes
- ✅ Typecheck passes
- ✅ Build succeeds
- ✅ Build output verified

### Pre-Production Checks (Manual)

Before promoting to production:
- [ ] Preview deployment tested
- [ ] QA smoke tests passed
- [ ] Security headers verified
- [ ] PWA functionality tested
- [ ] Mobile responsiveness verified

## Rollback Procedure

### Cloudflare Pages Rollback

1. Go to Cloudflare Dashboard
2. Navigate to Pages → Your Project
3. Click "Deployments"
4. Find previous working deployment
5. Click "..." → "Retry deployment" or "Promote to production"

### Quick Rollback Steps

```bash
# Option 1: Revert commit and push
git revert HEAD
git push origin main

# Option 2: Rollback to specific commit
git reset --hard <previous-commit-hash>
git push --force origin main  # ⚠️ Use with caution
```

**⚠️ Warning:** Force push should only be used in emergencies and with team coordination.

## Direct Upload (Advanced)

If you need custom build steps or CI-controlled deployment:

### Using Wrangler

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Build
npm run build

# Deploy
wrangler pages deploy dist --project-name=sacco1
```

### GitHub Actions Direct Upload

See `.github/workflows/deploy.yml` (if created) for automated direct upload workflow.

## Monitoring Deployments

### Cloudflare Dashboard

- View deployment history
- Check build logs
- Monitor deployment status
- View deployment URLs

### Build Logs

Check for:
- ✅ Build success
- ✅ Environment variables loaded
- ✅ Output directory created
- ❌ Any errors or warnings

## Troubleshooting

### Build Fails in CI

**Symptoms:**
- GitHub Actions workflow fails
- Build step errors

**Solutions:**
1. Check build logs in GitHub Actions
2. Verify Node.js version matches `.nvmrc`
3. Check for dependency issues
4. Verify environment variables (if needed)

### Build Fails on Cloudflare

**Symptoms:**
- Cloudflare Pages build fails
- Deployment doesn't complete

**Solutions:**
1. Check Cloudflare build logs
2. Verify build command is correct
3. Check output directory matches
4. Verify environment variables are set
5. Check Node.js version compatibility

### Preview Not Working

**Symptoms:**
- Preview URL shows errors
- Preview uses wrong environment

**Solutions:**
1. Verify preview environment variables are set
2. Check preview deployment logs
3. Ensure PR is open (previews only for PRs)
4. Clear browser cache

## Best Practices

1. **Always Test Previews**
   - Never merge without testing preview
   - Use preview for QA and stakeholder review

2. **Monitor Build Times**
   - Keep builds under 10 minutes
   - Optimize if builds are slow

3. **Version Control**
   - Always commit `package-lock.json`
   - Pin Node.js version (`.nvmrc`)
   - Document breaking changes

4. **Deployment Communication**
   - Notify team of production deployments
   - Document what changed
   - Monitor for issues post-deployment

## Related Files

- `.github/workflows/ci.yml` - CI pipeline
- `.nvmrc` - Node.js version
- `package.json` - Build scripts
- `vite.config.ts` - Build configuration

## References

- [Cloudflare Pages CI/CD](https://developers.cloudflare.com/pages/platform/git-integration/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Wrangler Pages Deploy](https://developers.cloudflare.com/workers/wrangler/commands/#pages-deploy)

