# Cloudflare Pages Configuration Guide

## SSL/TLS Configuration (Full Strict)

### Dashboard Settings

1. **Go to:** Cloudflare Dashboard → Your Domain → SSL/TLS

2. **Overview Tab:**
   - Set SSL/TLS encryption mode to **Full (strict)**
   - This ensures end-to-end encryption with certificate validation

3. **Edge Certificates Tab:**
   - Enable **Always Use HTTPS**
   - Enable **Automatic HTTPS Rewrites**
   - Enable **TLS 1.3**
   - Set **Minimum TLS Version** to TLS 1.2

4. **Client Certificates Tab:**
   - For API routes: Consider enabling mTLS if needed

### Origin Certificate (if using custom server)

```bash
# Not needed for Pages - Cloudflare handles origin automatically
```

## Custom Domain Setup

### Step 1: Add Domain

1. Go to **Pages → Your Project → Custom domains**
2. Click **Set up custom domain**
3. Enter your domain (e.g., `app.ibimina.rw`)

### Step 2: Configure DNS

Add the following DNS record:

| Type  | Name  | Target                           | Proxy |
|-------|-------|----------------------------------|-------|
| CNAME | app   | your-project.pages.dev           | ✅    |

Or for root domain:

| Type  | Name  | Target                           | Proxy |
|-------|-------|----------------------------------|-------|
| CNAME | @     | your-project.pages.dev           | ✅    |

### Step 3: Verify

- Wait for DNS propagation (up to 24 hours)
- Cloudflare will automatically issue SSL certificate
- Check status in Custom domains tab

## Caching Configuration

### Page Rules

1. **Static Assets (Long Cache)**
   - URL Pattern: `*ibimina.rw/assets/*`
   - Settings:
     - Cache Level: Cache Everything
     - Edge Cache TTL: 1 year
     - Browser Cache TTL: 1 year

2. **API Routes (No Cache)**
   - URL Pattern: `*ibimina.rw/api/*`
   - Settings:
     - Cache Level: Bypass

3. **HTML Pages (Short Cache)**
   - URL Pattern: `*ibimina.rw/*.html`
   - Settings:
     - Cache Level: Standard
     - Edge Cache TTL: 1 hour
     - Browser Cache TTL: 0 (no-store)

### Headers File (public/_headers)
Already configured in the project with proper caching rules.

## Environment Variables

### Required Variables (set in Cloudflare Dashboard)

| Variable | Environment | Value |
|----------|-------------|-------|
| `VITE_SUPABASE_URL` | Production | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Production | `eyJhbGciOi...` |
| `VITE_SENTRY_DSN` | Production | `https://xxx@sentry.io/xxx` |
| `VITE_APP_VERSION` | Production | `1.0.0` |
| `VITE_USE_MOCK_DATA` | Production | `false` |

### Setting Variables

1. Go to **Pages → Your Project → Settings → Environment Variables**
2. Add each variable for Production
3. Optionally add different values for Preview

## Security Headers

Already configured via `public/_headers`:
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

## Performance Settings

### Speed Tab

1. **Auto Minify:** Enable for JavaScript, CSS, HTML
2. **Brotli:** Enable (better compression)
3. **Early Hints:** Enable
4. **Rocket Loader:** Disable (conflicts with React)

### Caching Tab

1. **Caching Level:** Standard
2. **Browser Cache TTL:** Respect Existing Headers
3. **Crawler Hints:** Enable

## Deployment Commands

```bash
# Install Wrangler (if not installed)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy to production
npm run build
wrangler pages deploy dist --project-name=ibimina-gemini

# Deploy to preview (staging)
wrangler pages deploy dist --project-name=ibimina-gemini --branch=staging
```

## Verification Checklist

- [ ] SSL/TLS set to Full (strict)
- [ ] Always Use HTTPS enabled
- [ ] TLS 1.3 enabled
- [ ] Minimum TLS 1.2
- [ ] Custom domain added and verified
- [ ] DNS records configured correctly
- [ ] Environment variables set
- [ ] Security headers visible (test with securityheaders.com)
- [ ] Caching rules applied
- [ ] Auto minification enabled
- [ ] Brotli compression enabled

## Useful Commands

```bash
# Check deployment status
wrangler pages deployment list --project-name=ibimina-gemini

# Tail logs
wrangler pages deployment tail --project-name=ibimina-gemini

# Rollback to previous deployment
wrangler pages deployment rollback --project-name=ibimina-gemini
```
