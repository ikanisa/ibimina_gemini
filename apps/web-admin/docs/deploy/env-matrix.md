# Environment Variables Matrix

## Overview

This document provides a complete matrix of all environment variables used across different deployment environments.

## Variable Categories

### Build-Time Variables (Vite)

These variables are embedded into the build at build time. They must start with `VITE_` to be exposed to the browser.

### Runtime Variables

Not applicable - this is a static SPA with no Cloudflare Workers/Functions.

## Environment Matrix

| Variable | Development | Preview | Production | Where Configured | Notes |
|----------|-------------|---------|------------|------------------|-------|
| `VITE_SUPABASE_URL` | `https://local-project.supabase.co` | `https://preview-project.supabase.co` | `https://prod-project.supabase.co` | Cloudflare Pages → Settings → Environment Variables | Required |
| `VITE_SUPABASE_ANON_KEY` | Local anon key | Preview anon key | Production anon key | Cloudflare Pages → Settings → Environment Variables | Required, public |
| `VITE_USE_MOCK_DATA` | `true` (optional) | `false` | `false` | Cloudflare Pages → Settings → Environment Variables | Optional, defaults to false |
| `NODE_VERSION` | `20.19.0` | `20.19.0` | `20.19.0` | `.nvmrc` file | Build environment |
| `GEMINI_API_KEY` | N/A (server-side) | N/A (server-side) | N/A (server-side) | Supabase Functions Secrets | Not used in frontend |

## Configuration Locations

### Cloudflare Pages

**Path:** Pages Dashboard → Your Project → Settings → Environment Variables

**How to Set:**
1. Go to Cloudflare Dashboard
2. Navigate to Pages → Your Project
3. Click "Settings" → "Environment Variables"
4. Add variables for each environment (Production, Preview, Development)

**Variables to Set:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_USE_MOCK_DATA` (optional)

### Local Development

**Path:** `.env.local` file (git-ignored)

**How to Set:**
1. Copy `.env.example` to `.env.local`
2. Fill in your values
3. Restart dev server

**Example `.env.local`:**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_USE_MOCK_DATA=false
```

## Variable Details

### VITE_SUPABASE_URL

**Type:** Build-time, Public
**Required:** Yes
**Format:** `https://[project-id].supabase.co`
**Example:** `https://abcdefghijklmnop.supabase.co`

**Where to Get:**
1. Go to Supabase Dashboard
2. Project Settings → API
3. Copy "Project URL"

**Security:** This is public and safe to expose (it's just the API endpoint)

### VITE_SUPABASE_ANON_KEY

**Type:** Build-time, Public
**Required:** Yes
**Format:** Long string (JWT-like)
**Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Where to Get:**
1. Go to Supabase Dashboard
2. Project Settings → API
3. Copy "anon public" key

**Security:** 
- This is the **public** key (safe to expose)
- Row Level Security (RLS) provides actual security
- Never use the `service_role` key in frontend

### VITE_USE_MOCK_DATA

**Type:** Build-time, Public
**Required:** No
**Default:** `false`
**Values:** `true` | `false`

**Purpose:** 
- `true`: Run app with mock data (no Supabase needed)
- `false`: Connect to real Supabase

**Use Cases:**
- Development: Can use `true` for UI development
- Preview: Always `false`
- Production: Always `false`

### NODE_VERSION

**Type:** Build environment
**Required:** Yes
**Value:** `18` (or `20`)
**Configured:** `.nvmrc` file

**Purpose:** Ensures consistent Node.js version across environments

### GEMINI_API_KEY

**Type:** Server-side only (Supabase Functions)
**Required:** No (only if using OCR features)
**Configured:** Supabase Functions Secrets

**Important:** 
- ❌ NOT set in Cloudflare Pages
- ✅ Set in Supabase Dashboard → Functions → Secrets
- Used by `ocr-extract` and `staff-invite` functions

## Environment-Specific Values

### Development

**Supabase:** Use a separate development Supabase project or local Supabase

**Recommended:**
```bash
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev-anon-key
VITE_USE_MOCK_DATA=false  # or true for UI-only work
```

### Preview

**Supabase:** Use a preview/staging Supabase project

**Recommended:**
```bash
VITE_SUPABASE_URL=https://preview-project.supabase.co
VITE_SUPABASE_ANON_KEY=preview-anon-key
VITE_USE_MOCK_DATA=false
```

### Production

**Supabase:** Use production Supabase project

**Required:**
```bash
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod-anon-key
VITE_USE_MOCK_DATA=false
```

## Security Considerations

### ✅ Safe to Expose (Public)

- `VITE_SUPABASE_URL` - Just an API endpoint
- `VITE_SUPABASE_ANON_KEY` - Public key, protected by RLS
- `VITE_USE_MOCK_DATA` - Just a feature flag

### ❌ Never Expose

- Supabase `service_role` key
- `GEMINI_API_KEY` (server-side only)
- Any secret keys or tokens

### Best Practices

1. **Use RLS:** Supabase Row Level Security is your primary security layer
2. **Public Keys Only:** Only use `anon` key in frontend, never `service_role`
3. **Separate Projects:** Use different Supabase projects for dev/preview/prod
4. **Monitor Usage:** Set up Supabase usage alerts
5. **Rotate Keys:** Regularly rotate API keys

## Verification

### Check Variables in Build

After deployment, verify variables are set:

1. Open browser DevTools
2. Check `window` object (variables may be embedded)
3. Check network requests to Supabase
4. Verify app connects to correct Supabase project

### Test Environment Switching

1. Deploy to preview with preview env vars
2. Verify preview connects to preview Supabase
3. Deploy to production with prod env vars
4. Verify production connects to prod Supabase

## Troubleshooting

### Issue: Variables Not Working

**Symptoms:**
- App shows "Missing configuration" error
- Supabase connection fails

**Solutions:**
1. Verify variables start with `VITE_`
2. Restart build after adding variables
3. Check variable names match exactly (case-sensitive)
4. Verify variables are set for correct environment

### Issue: Wrong Supabase Project

**Symptoms:**
- App connects to wrong database
- Data appears incorrect

**Solutions:**
1. Check environment variable values
2. Verify correct environment is selected
3. Check Supabase project URLs match

## Related Files

- `.env.example` - Template for local development
- `.gitignore` - Excludes `.env.local` from git
- `lib/supabase.ts` - Uses environment variables
- `vite.config.ts` - Build configuration

## References

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Cloudflare Pages Environment Variables](https://developers.cloudflare.com/pages/platform/build-configuration/#environment-variables)
- [Supabase API Keys](https://supabase.com/docs/guides/api/api-keys)

