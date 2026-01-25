# Environment Variables Reference

## Overview

This document lists all environment variables used in the IBIMINA GEMINI application and how to configure them for different environments.

## Required Variables

### `VITE_SUPABASE_URL`

**Description:** Supabase project URL  
**Type:** String (URL)  
**Required:** Yes  
**Example:** `https://xxxxx.supabase.co`

**How to get:**
1. Go to Supabase Dashboard → Project Settings → API
2. Copy "Project URL"

**Environments:**
- Production: Production Supabase project URL
- Staging: Staging Supabase project URL
- Development: Development Supabase project URL

---

### `VITE_SUPABASE_ANON_KEY`

**Description:** Supabase anonymous (public) key  
**Type:** String (JWT)  
**Required:** Yes  
**Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**How to get:**
1. Go to Supabase Dashboard → Project Settings → API
2. Copy "anon public" key

**Security Note:** This is a public key and safe to expose in client-side code. Row-Level Security (RLS) policies protect your data.

**Environments:**
- Production: Production Supabase anon key
- Staging: Staging Supabase anon key
- Development: Development Supabase anon key

---

## Optional Variables

### `VITE_SENTRY_DSN`

**Description:** Sentry DSN for error tracking  
**Type:** String (URL)  
**Required:** No (optional)  
**Example:** `https://xxx@xxx.ingest.sentry.io/xxx`

**How to get:**
1. Go to Sentry Dashboard → Settings → Projects
2. Select your project
3. Copy "Client Keys (DSN)"

**Environments:**
- Production: Production Sentry project DSN
- Staging: Staging Sentry project DSN (optional)
- Development: Leave empty or use test project

---

### `VITE_APP_VERSION`

**Description:** Application version  
**Type:** String  
**Required:** No  
**Default:** `development`  
**Example:** `1.0.0` or `git-abc1234`

**Usage:**
- Set to package.json version: `1.0.0`
- Set to git commit hash: `abc1234`
- Set to git tag: `v1.0.0`

**Environments:**
- Production: Release version or git tag
- Staging: Branch name or commit hash
- Development: `development`

---

### `VITE_SENTRY_DEBUG`

**Description:** Enable Sentry in development  
**Type:** Boolean (string)  
**Required:** No  
**Default:** `false`  
**Example:** `true` or `false`

**Usage:**
- Set to `true` to enable Sentry in development
- Set to `false` or leave empty to disable

**Environments:**
- Production: Not needed (always enabled)
- Staging: `false` (optional)
- Development: `true` (if testing Sentry)

---

### `VITE_DEBUG_VITALS`

**Description:** Enable Web Vitals logging to console  
**Type:** Boolean (string)  
**Required:** No  
**Default:** `false`  
**Example:** `true` or `false`

**Usage:**
- Set to `true` to log Web Vitals to browser console
- Useful for debugging performance issues

**Environments:**
- Production: `false`
- Staging: `false` (optional)
- Development: `true` (optional)

---

## Environment-Specific Configuration

### Local Development (`.env.local`)

Create `.env.local` file in project root:

```bash
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-anon-key
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_SENTRY_DEBUG=true
VITE_DEBUG_VITALS=true
VITE_APP_VERSION=development
```

**Note:** `.env.local` is gitignored and should not be committed.

### Cloudflare Pages (Production)

Set in Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables:

**Production Environment:**
```bash
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_APP_VERSION=1.0.0
```

**Preview Environment:**
```bash
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-anon-key
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_APP_VERSION=preview
```

### GitHub Actions (CI/CD)

Set in GitHub Repository → Settings → Secrets and variables → Actions:

**Required Secrets:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SENTRY_DSN` (optional)
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Variable Naming Convention

All client-side variables **must** start with `VITE_` prefix. This is a Vite requirement - only variables with this prefix are exposed to the client bundle.

**Correct:**
- `VITE_SUPABASE_URL` ✅
- `VITE_SENTRY_DSN` ✅

**Incorrect:**
- `SUPABASE_URL` ❌ (not exposed to client)
- `API_KEY` ❌ (not exposed to client)

## Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Use different Supabase projects** for dev/staging/prod
3. **Rotate keys regularly** - Especially if compromised
4. **Use Supabase service role key** only in server-side code (Edge Functions)
5. **Monitor Sentry** for exposed keys in error messages

## Verification

### Check Variables in Browser

Open browser DevTools → Console:

```javascript
// Check if variables are loaded
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Sentry DSN:', import.meta.env.VITE_SENTRY_DSN);
console.log('App Version:', import.meta.env.VITE_APP_VERSION);
```

### Verify in Build

Variables are replaced at build time. Check built files:

```bash
# Build and check dist files
npm run build
grep -r "VITE_SUPABASE_URL" dist/
```

## Troubleshooting

### Variables Not Available

**Issue:** `import.meta.env.VITE_XXX` is `undefined`

**Solutions:**
1. Verify variable name starts with `VITE_`
2. Rebuild after adding variables: `npm run build`
3. Restart dev server: `npm run dev`
4. Check `.env.local` file exists and is in project root
5. Verify variables are set in Cloudflare Dashboard (for production)

### Variables Exposed in Build

**Issue:** Sensitive variables appear in built files

**Solutions:**
1. Only use `VITE_` prefix for safe-to-expose variables
2. Never use service role keys with `VITE_` prefix
3. Use Edge Functions for sensitive operations

### Build Fails with Missing Variables

**Issue:** Build fails because variables are undefined

**Solutions:**
1. Provide default values in code:
   ```typescript
   const url = import.meta.env.VITE_SUPABASE_URL || 'https://default.supabase.co';
   ```
2. Make variables optional in code
3. Set variables in build environment

## Files

- `.env.local` - Local development variables (gitignored)
- `.env.example` - Example environment file (committed)
- `wrangler.toml` - Cloudflare Pages configuration
- `.github/workflows/deploy.yml` - CI/CD workflow
- `docs/ENVIRONMENT_VARIABLES.md` - This guide

## Next Steps

1. **Create `.env.local`** for local development
2. **Set variables in Cloudflare Dashboard** for production
3. **Set GitHub Secrets** for CI/CD (if using)
4. **Verify variables** in browser console
5. **Test application** with configured variables
