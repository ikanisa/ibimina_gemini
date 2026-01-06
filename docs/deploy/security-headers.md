# Security Headers Configuration

## Overview

This document describes the security headers configured for the SACCO+ Admin Portal on Cloudflare Pages and how to tune them safely.

## Current Configuration

The `public/_headers` file defines security headers that Cloudflare Pages applies to all responses.

### Headers Applied

#### 1. Content-Security-Policy (CSP)
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https: blob:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co;
frame-src 'self' https://*.supabase.co;
worker-src 'self' blob:;
manifest-src 'self';
base-uri 'self';
form-action 'self';
```

**Purpose:** Prevents XSS attacks by controlling resource loading

**Notes:**
- `'unsafe-inline'` and `'unsafe-eval'` are required for Vite's development mode
- In production, Vite should eliminate these, but they're kept for compatibility
- Supabase domains are explicitly allowed for API calls

#### 2. X-Frame-Options
```
DENY
```

**Purpose:** Prevents clickjacking by blocking iframe embedding

#### 3. X-Content-Type-Options
```
nosniff
```

**Purpose:** Prevents MIME type sniffing attacks

#### 4. Referrer-Policy
```
strict-origin-when-cross-origin
```

**Purpose:** Controls referrer information sent with requests

#### 5. Permissions-Policy
```
geolocation=(), microphone=(), camera=(), payment=()
```

**Purpose:** Disables browser features not needed by the app

#### 6. Strict-Transport-Security (HSTS)
```
max-age=31536000; includeSubDomains; preload
```

**Purpose:** Forces HTTPS connections

**⚠️ Warning:** Only enable if all subdomains support HTTPS

#### 7. X-XSS-Protection
```
1; mode=block
```

**Purpose:** Legacy XSS protection (modern browsers ignore, but harmless)

## Tuning CSP Per Environment

### Development

More permissive CSP for development:
```
Content-Security-Policy: default-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://*.supabase.co wss://*.supabase.co http://localhost:* ws://localhost:*;
```

### Production

Stricter CSP (current configuration):
- Remove `'unsafe-inline'` and `'unsafe-eval'` if possible
- Only allow specific Supabase domains
- Restrict image sources if needed

### CSP Violation Monitoring

To monitor CSP violations:

1. Add report-uri to CSP:
```
Content-Security-Policy: ...; report-uri https://your-reporting-endpoint.com/csp-report;
```

2. Or use report-to (modern):
```
Content-Security-Policy: ...; report-to csp-endpoint;
Report-To: {"group":"csp-endpoint","max_age":10886400,"endpoints":[{"url":"https://your-endpoint.com/report"}]}
```

## Caching Strategy

### Hashed Assets (Immutable)
```
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

**Rationale:** Hashed filenames change when content changes, so safe to cache forever.

### HTML Files (No Cache)
```
/*.html
  Cache-Control: no-cache, no-store, must-revalidate
```

**Rationale:** HTML must always be fresh to get latest app version.

### Service Worker (No Cache)
```
/sw.js
  Cache-Control: no-cache, no-store, must-revalidate
```

**Rationale:** Service worker updates must be immediate.

### Manifest (Short Cache)
```
/manifest.webmanifest
  Cache-Control: public, max-age=3600
```

**Rationale:** Manifest changes infrequently, but should update within an hour.

## Testing Security Headers

### Browser DevTools

1. Open DevTools → Network tab
2. Reload page
3. Click on any request
4. Check "Response Headers" section
5. Verify all security headers are present

### Online Tools

- [SecurityHeaders.com](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)

### Command Line

```bash
curl -I https://sacco1.pages.dev | grep -i "x-frame\|x-content-type\|content-security\|strict-transport"
```

## Troubleshooting

### Issue: CSP Blocks Legitimate Resources

**Symptoms:**
- Images don't load
- API calls fail
- Styles broken

**Solutions:**
1. Check browser console for CSP violation reports
2. Add required domains to appropriate CSP directive
3. Test incrementally (add one domain at a time)

### Issue: Service Worker Not Updating

**Symptoms:**
- Old version persists after deployment
- Changes not reflected

**Solutions:**
1. Verify `sw.js` has `no-cache` header
2. Check service worker registration code
3. Clear browser cache and service workers

### Issue: HSTS Breaking Development

**Symptoms:**
- Local development fails
- HTTP connections blocked

**Solutions:**
1. HSTS only applies to production domain
2. Local development uses `localhost` (not affected)
3. If testing on custom domain, use HTTPS

## Security Best Practices

1. **Start Permissive, Tighten Gradually**
   - Begin with permissive CSP
   - Monitor violations
   - Tighten rules incrementally

2. **Use Report-URI**
   - Monitor CSP violations in production
   - Identify legitimate resources that need whitelisting

3. **Regular Audits**
   - Review security headers quarterly
   - Update CSP as dependencies change
   - Test after major updates

4. **Document Changes**
   - Record why each header is configured
   - Note any exceptions and their rationale

## Related Files

- `public/_headers` - Header configuration
- `vite.config.ts` - Build configuration
- `docs/deploy/cloudflare-readiness.md` - Full deployment audit

## References

- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Cloudflare Pages Headers](https://developers.cloudflare.com/pages/platform/headers/)
- [OWASP Secure Headers](https://owasp.org/www-project-secure-headers/)

