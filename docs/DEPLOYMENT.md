# Ibimina Gemini Deployment Guide

## Overview

This guide covers deployment to Cloudflare Pages with Supabase backend.

---

## Prerequisites

1. **Node.js** 18+ installed
2. **Cloudflare** account with Pages enabled
3. **Supabase** project created
4. **Wrangler CLI** installed: `npm install -g wrangler`

---

## Environment Configuration

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | ✅ |
| `VITE_SENTRY_DSN` | Sentry error tracking DSN | ⚠️ Prod |
| `VITE_APP_URL` | Production app URL | ⚠️ Prod |

### Local Development

```bash
# Copy example to local config
cp .env.example .env.local

# Edit with your values
nano .env.local
```

### Cloudflare Pages Configuration

1. Go to Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables
2. Add each variable for both **Production** and **Preview** environments
3. Mark sensitive values as encrypted

---

## Build & Deploy

### Local Build Test

```bash
# Install dependencies
npm install

# Run type checking
npm run typecheck

# Run tests
npm run test

# Build for production
npm run build

# Preview locally
npm run preview
```

### Deploy to Cloudflare Pages

#### Option 1: Git Integration (Recommended)

1. Connect your GitHub/GitLab repository
2. Set build configuration:
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node.js version:** 18

3. Push to main branch to trigger deploy

#### Option 2: Direct Upload (Wrangler)

```bash
# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy dist --project-name=sacco
```

---

## Database Migrations

### Run Migrations (Supabase CLI)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run pending migrations
supabase db push
```

### Migration Files

Located in `supabase/migrations/`. Run in order:

1. `20260102000000_initial_schema.sql`
2. `20260107000000_redesign_consolidated_schema.sql`
3. `20260107100000_settings_module.sql`
4. ... (remaining modules)
5. `20260112000000_complete_rls_policies.sql`
6. `20260112000001_add_indexes.sql`

---

## Post-Deployment Verification

### Health Checks

1. **App loads:** Visit `https://your-domain.pages.dev`
2. **Auth works:** Test login/logout flow
3. **API responds:** Check network tab for Supabase calls
4. **PWA registered:** Check DevTools → Application → Service Workers

### Performance Audit

```bash
# Run Lighthouse
npx lighthouse https://your-domain.pages.dev --view
```

Target scores:
- Performance: >80
- Accessibility: >90
- Best Practices: >90
- SEO: >80

---

## Monitoring

### Sentry Setup

1. Create project at sentry.io
2. Get DSN from Settings → Projects → Your Project → Client Keys
3. Add `VITE_SENTRY_DSN` to Cloudflare environment variables
4. Redeploy

### Cloudflare Analytics

Enabled automatically for Pages projects. View at:
Dashboard → Analytics & Logs → Web Analytics

---

## Rollback Procedure

### Quick Rollback

```bash
# List recent deployments
wrangler pages deployment list --project-name=sacco

# Rollback to specific deployment
wrangler pages deployment rollback --deployment-id=DEPLOYMENT_ID
```

### Via Dashboard

1. Go to Cloudflare Dashboard → Pages → Your Project → Deployments
2. Find stable deployment
3. Click "..." → "Rollback to this deployment"

---

## SSL/TLS Configuration

Cloudflare Pages includes free SSL. For custom domains:

1. Add custom domain in Pages settings
2. Cloudflare auto-provisions certificate
3. Recommended: Enable "Full (strict)" mode in SSL settings

---

## Troubleshooting

### Build Failures

```bash
# Check Node version
node --version  # Should be 18+

# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Service Worker Issues

```bash
# Clear all caches
# In browser: DevTools → Application → Storage → Clear site data
```

### Environment Variable Not Working

1. Verify variable name starts with `VITE_`
2. Check it's set for correct environment (Production/Preview)
3. Redeploy after adding new variables

---

## Security Checklist

- [ ] All secrets in environment variables (not in code)
- [ ] RLS policies enabled on all Supabase tables
- [ ] `VITE_USE_MOCK_DATA` set to `false` in production
- [ ] Sentry DSN configured for error tracking
- [ ] Rate limiting active on Supabase
- [ ] Strong session timeout (30 min)
