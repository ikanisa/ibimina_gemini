# Cloudflare Pages Deployment Setup Guide

## Overview

This guide covers the complete setup and deployment process for the IBIMINA GEMINI application on Cloudflare Pages.

## Prerequisites

1. **Cloudflare Account**: Sign up at https://dash.cloudflare.com
2. **Wrangler CLI**: Install Cloudflare CLI
   ```bash
   npm install -g wrangler
   # Or use npx: npx wrangler@latest
   ```
3. **Cloudflare Authentication**:
   ```bash
   wrangler login
   ```

## Configuration Files

### 1. `wrangler.toml`

Main configuration file for Cloudflare Pages deployment.

**Key Settings:**
- `name`: Project name on Cloudflare
- `compatibility_date`: Cloudflare Workers compatibility date
- `build.command`: Build command (runs before deployment)
- `build.upload.dir`: Output directory (dist/)

### 2. `public/_headers`

Security headers and caching rules for all routes.

**Features:**
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- Cache control for static assets
- No-cache for HTML files (SPA routing)

### 3. `public/_redirects`

SPA routing configuration - redirects all routes to index.html.

**Configuration:**
```
/*    /index.html   200
```

## Environment Variables

### Required Variables

Set these in Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables:

#### Production Environment

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `VITE_SENTRY_DSN` | Sentry DSN (optional) | `https://xxx@sentry.io/xxx` |
| `VITE_APP_VERSION` | App version | `1.0.0` or git commit hash |

#### Development/Staging Environments

Same variables as production, but with different values for staging/test Supabase projects.

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_SENTRY_DEBUG` | Enable Sentry in dev | `false` |
| `VITE_DEBUG_VITALS` | Enable Web Vitals logging | `false` |

### Setting Environment Variables

**Via Cloudflare Dashboard:**
1. Go to Cloudflare Dashboard → Pages → Your Project
2. Settings → Environment Variables
3. Add variables for each environment (Production, Preview, Development)
4. Save changes

**Via Wrangler CLI:**
```bash
# Set production variable
wrangler pages secret put VITE_SUPABASE_URL --project-name=sacco

# Set preview variable
wrangler pages secret put VITE_SUPABASE_URL --project-name=sacco --env=preview
```

## Deployment Methods

### Method 1: Cloudflare Dashboard (Recommended)

1. **Connect Repository:**
   - Go to Cloudflare Dashboard → Pages
   - Click "Create a project"
   - Connect GitHub/GitLab repository
   - Select repository and branch

2. **Configure Build:**
   - Build command: `npm ci && npm run build`
   - Build output directory: `dist`
   - Root directory: `/` (project root)

3. **Set Environment Variables:**
   - Add all required environment variables
   - Set for Production and Preview environments

4. **Deploy:**
   - Cloudflare will automatically deploy on push to main branch
   - Preview deployments for pull requests

### Method 2: Wrangler CLI

**Initial Deployment:**
```bash
# Build the project
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=sacco
```

**Update Deployment:**
```bash
# Build and deploy
npm run build && wrangler pages deploy dist --project-name=sacco
```

**Deploy to Specific Environment:**
```bash
# Deploy to production
wrangler pages deploy dist --project-name=sacco --env=production

# Deploy to staging
wrangler pages deploy dist --project-name=sacco --env=staging
```

### Method 3: GitHub Actions (CI/CD)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}
          VITE_APP_VERSION: ${{ github.sha }}
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: sacco
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

**Required GitHub Secrets:**
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with Pages:Edit permission
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_SENTRY_DSN`: Sentry DSN (optional)

## Custom Domain Setup

### Step 1: Add Domain in Cloudflare Dashboard

1. Go to Cloudflare Dashboard → Pages → Your Project
2. Custom domains → Add a custom domain
3. Enter your domain (e.g., `app.yourdomain.com`)
4. Follow DNS setup instructions

### Step 2: Configure DNS

Add CNAME record in your DNS provider:
- **Type**: CNAME
- **Name**: `app` (or subdomain of choice)
- **Target**: `sacco.pages.dev`
- **Proxy**: Enabled (orange cloud)

### Step 3: SSL Certificate

Cloudflare automatically provisions SSL certificates:
- SSL/TLS encryption mode: Full (strict)
- Automatic HTTPS Rewrites: Enabled
- Always Use HTTPS: Enabled

### Step 4: Update wrangler.toml (Optional)

```toml
[env.production.routes]
zone_name = "yourdomain.com"
pattern = "app.yourdomain.com"
```

## Preview Deployments

Cloudflare automatically creates preview deployments for:
- Pull requests
- Branch pushes (non-main)

**Access Preview:**
- Preview URL: `https://<branch-name>.<project-name>.pages.dev`
- Available in GitHub PR comments (if connected)

## Deployment Verification

### 1. Check Deployment Status

```bash
# List deployments
wrangler pages deployment list --project-name=sacco

# Get deployment details
wrangler pages deployment tail --project-name=sacco
```

### 2. Verify Application

After deployment, verify:
- [ ] Application loads correctly
- [ ] Environment variables are set
- [ ] Supabase connection works
- [ ] Authentication works
- [ ] API requests succeed
- [ ] Service worker registers
- [ ] PWA manifest loads

### 3. Test Health Check

```bash
# Test health endpoint (if deployed)
curl https://sacco.pages.dev/api/health

# Or test Supabase health
curl https://your-project.supabase.co/functions/v1/health
```

### 4. Check Console for Errors

Open browser DevTools → Console:
- No critical errors
- Supabase connection successful
- Sentry initialized (if configured)

## Performance Optimization

### 1. Enable Cloudflare CDN

Cloudflare Pages automatically uses CDN:
- Global edge network
- Automatic caching
- DDoS protection

### 2. Configure Caching

Already configured in `public/_headers`:
- Static assets: 1 year cache
- HTML files: No cache (for SPA updates)
- Service worker: No cache

### 3. Enable Compression

Cloudflare automatically compresses:
- Gzip compression
- Brotli compression (if supported)

### 4. Enable Cloudflare Analytics

1. Go to Cloudflare Dashboard → Analytics
2. Enable Web Analytics
3. View performance metrics

## Troubleshooting

### Build Failures

**Issue**: Build fails in Cloudflare
**Solution**:
1. Check build logs in Cloudflare Dashboard
2. Verify Node.js version (should be 20+)
3. Check for missing dependencies
4. Verify build command: `npm ci && npm run build`

### Environment Variables Not Working

**Issue**: Environment variables not available in app
**Solution**:
1. Verify variables are set in Cloudflare Dashboard
2. Check variable names (must start with `VITE_`)
3. Rebuild and redeploy after adding variables
4. Check browser console for undefined values

### Routing Issues (404 on Refresh)

**Issue**: Getting 404 on page refresh
**Solution**:
1. Verify `public/_redirects` file exists:
   ```
   /*    /index.html   200
   ```
2. Ensure file is in `dist/` after build
3. Check Cloudflare Pages settings → Functions → Redirects

### Service Worker Not Updating

**Issue**: Service worker not updating after deployment
**Solution**:
1. Clear browser cache
2. Unregister service worker in DevTools
3. Verify `sw.js` has no-cache headers
4. Check service worker version in code

### CORS Issues

**Issue**: CORS errors with Supabase
**Solution**:
1. Verify Supabase URL is correct
2. Check Supabase CORS settings
3. Verify `_headers` file allows Supabase domains
4. Check CSP headers in `_headers`

## Rollback

### Via Cloudflare Dashboard

1. Go to Cloudflare Dashboard → Pages → Your Project
2. Deployments → Select previous deployment
3. Click "Retry deployment" or "Promote to production"

### Via Wrangler CLI

```bash
# List deployments
wrangler pages deployment list --project-name=sacco

# Rollback to specific deployment
wrangler pages deployment rollback <deployment-id> --project-name=sacco
```

## Monitoring

### Cloudflare Analytics

- Page views
- Unique visitors
- Core Web Vitals
- Error rates

### Sentry Integration

- Error tracking
- Performance monitoring
- Release tracking

### Uptime Monitoring

- Health check endpoint
- UptimeRobot/Better Uptime integration

## Cost Considerations

**Cloudflare Pages Pricing:**
- **Free tier**: 500 builds/month, unlimited requests
- **Bundled plan**: $20/month (includes Workers, Pages, etc.)
- **Pay-as-you-go**: $0.50 per 1,000 builds

For most use cases, free tier is sufficient.

## Files

- `wrangler.toml` - Cloudflare Pages configuration
- `public/_headers` - Security headers and caching
- `public/_redirects` - SPA routing configuration
- `docs/CLOUDFLARE_DEPLOYMENT_SETUP.md` - This guide

## Next Steps

1. **Set up Cloudflare account** and authenticate
2. **Configure environment variables** in Cloudflare Dashboard
3. **Deploy initial version** via Dashboard or CLI
4. **Set up custom domain** (optional)
5. **Configure CI/CD** (optional, recommended)
6. **Set up monitoring** (Sentry, uptime monitoring)
7. **Test deployment** and verify all features work

## Support

- **Cloudflare Docs**: https://developers.cloudflare.com/pages/
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler/
- **Cloudflare Community**: https://community.cloudflare.com/
