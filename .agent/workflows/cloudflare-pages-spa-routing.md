---
description: Prevent 404s on refresh / deep links for SPA routing
---

# Cloudflare Pages SPA Routing Workflow

// turbo-all

## Problem

Single Page Applications (SPAs) use client-side routing. When a user:
- Refreshes on `/dashboard`
- Shares a deep link like `https://app.com/members/123`
- Bookmarks a route

...Cloudflare tries to find a literal file at that path. Without proper configuration, users get **404 errors**.

---

## The Fix

### Required: `public/_redirects`

Create or verify `public/_redirects` contains:

```
/*    /index.html   200
```

This tells Cloudflare: "For ANY path that doesn't match a real file, serve `index.html` with a 200 status."

> [!IMPORTANT]
> The `200` status is critical! Using `301` or `302` would cause a redirect loop.

---

## Verification Steps

### 1. Check File Exists

```bash
# Verify _redirects exists in public/
cat public/_redirects
```

Expected output:
```
/*    /index.html   200
```

### 2. Check Build Output

```bash
# After building, verify _redirects is copied to dist/
npm run build
cat dist/_redirects
```

### 3. Test Locally

```bash
# Start preview server
npm run preview
```

Then test:
- Navigate to `/dashboard` → Should load app
- Refresh page → Should NOT 404
- Directly visit `http://localhost:4173/some/deep/route` → Should load app

### 4. Test Production

```bash
# After deploying, test deep links
curl -s https://your-app.pages.dev/dashboard | head -5
```

Expected: HTML content (not 404 page).

---

## Common Issues

### Issue: _redirects Not Copied to dist/

**Symptom**: File exists in `public/` but not in `dist/`.

**Fix**: Vite should automatically copy `public/` contents. Verify `vite.config.ts`:

```typescript
export default defineConfig({
  publicDir: 'public',  // This is the default
  // ...
})
```

### Issue: _redirects Syntax Error

**Symptom**: 404s despite file existing.

**Fix**: Ensure proper spacing (use spaces or tabs, not mixed):

```
# CORRECT - spaces between columns
/*    /index.html   200

# INCORRECT - missing status code
/*    /index.html

# INCORRECT - wrong status code
/*    /index.html   301
```

### Issue: API Routes Also Redirecting

**Symptom**: Backend API calls being served `index.html`.

**Fix**: Add exceptions BEFORE the catch-all:

```
/api/*    https://api.example.com/:splat   200
/*        /index.html                       200
```

### Issue: Static Assets 404ing

**Symptom**: CSS/JS files returning HTML.

**Fix**: Cloudflare Pages serves real files first. If assets 404:
1. Check they exist in `dist/`
2. Verify asset paths in `index.html` are correct
3. Check for case-sensitivity issues

---

## Alternative: 404.html Fallback

Cloudflare Pages also supports a `404.html` fallback:

```bash
# In public/404.html - redirect to index with original URL
<script>
  // Preserve the path for client router
  window.location.href = '/' + window.location.pathname;
</script>
```

> [!NOTE]
> The `_redirects` approach is preferred as it returns 200 status (better for SEO and no flash).

---

## Full _redirects Example

```
# API proxy (if needed)
/api/*    https://api.backend.com/:splat    200

# Static file exceptions (usually not needed - Cloudflare serves real files first)
# /assets/*    /assets/:splat    200

# SPA fallback - MUST be last
/*    /index.html    200
```

---

## Checklist

- [ ] `public/_redirects` exists with `/*    /index.html   200`
- [ ] `dist/_redirects` present after build
- [ ] Deep links work locally (preview server)
- [ ] Deep links work in production
- [ ] Page refresh doesn't 404
- [ ] API routes excluded if needed

---

## Related Workflows

- `/cloudflare-pages-setup` — Initial production-grade setup
- `/cloudflare-pages-headers-security` — Security and cache headers
- `/cloudflare-pages-cache-stale` — Fix stale asset issues
