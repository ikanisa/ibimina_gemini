# Cloudflare Pages SPA Routing Configuration

## Overview

This document explains how client-side routing works in the SACCO+ Admin Portal when deployed to Cloudflare Pages.

## SPA Routing Challenge

React Router handles routing on the client side. When a user:
1. Navigates to `/dashboard` within the app → Works ✅
2. Refreshes the page at `/dashboard` → Would 404 ❌
3. Shares a direct link to `/groups` → Would 404 ❌

**Solution:** Cloudflare Pages `_redirects` file ensures all routes serve `index.html`.

## Implementation

### `public/_redirects` File

```apache
/*    /index.html   200
```

This rule:
- Matches all routes (`/*`)
- Serves `/index.html` (the React app)
- Returns HTTP 200 (not a redirect, so URL stays the same)

### How It Works

1. **Static Assets:** Files in `/assets/`, `/icons/`, etc. are served directly (they exist)
2. **Routes:** Any path that doesn't match a file → serves `index.html`
3. **React Router:** Takes over and renders the correct component based on the URL

### Build Process

Vite copies `public/_redirects` to `dist/_redirects` during build:
```bash
npm run build
# Copies public/_redirects → dist/_redirects
```

Cloudflare Pages reads `dist/_redirects` and applies the rules.

## Testing Deep Links

### Local Testing

1. Build the app:
   ```bash
   npm run build
   ```

2. Preview the build:
   ```bash
   npm run preview
   ```

3. Test deep links:
   - Open `http://localhost:4173/dashboard`
   - Open `http://localhost:4173/groups`
   - Open `http://localhost:4173/members`
   - Refresh the page - should still work

### Production Testing

After deployment to Cloudflare Pages:

1. **Direct Navigation:**
   - Visit `https://sacco1.pages.dev/dashboard`
   - Should load correctly (not 404)

2. **Refresh Test:**
   - Navigate to `/groups` within the app
   - Refresh the browser
   - Should stay on `/groups` (not redirect to home)

3. **Share Link Test:**
   - Copy URL from address bar while on `/members`
   - Open in incognito/private window
   - Should load the members page directly

## Troubleshooting

### Issue: Routes return 404

**Symptoms:**
- Direct links to routes return 404
- Refresh breaks navigation

**Solutions:**
1. Verify `_redirects` exists in `public/` directory
2. Check that `_redirects` is copied to `dist/` after build
3. Verify Cloudflare Pages is reading `dist/_redirects`
4. Check Cloudflare Pages build logs for errors

### Issue: Static assets not loading

**Symptoms:**
- Images, CSS, JS files return 404
- App appears broken

**Solutions:**
1. Ensure static assets are in `dist/assets/` after build
2. Check that `_redirects` rule doesn't interfere with assets
3. Verify Vite build output structure

### Issue: Infinite redirect loop

**Symptoms:**
- Page keeps reloading
- Browser shows redirect errors

**Solutions:**
1. Check `_redirects` syntax (should be `/* /index.html 200`)
2. Ensure no conflicting redirect rules
3. Clear browser cache

## Best Practices

1. **Always test deep links** after deployment
2. **Use 200 status** (not 301/302) to preserve URLs
3. **Keep `_redirects` simple** - one rule is usually enough
4. **Test in production** - local preview may behave differently

## Related Files

- `public/_redirects` - Routing rules
- `public/404.html` - Fallback for truly missing resources
- `vite.config.ts` - Build configuration
- `package.json` - Build scripts

## References

- [Cloudflare Pages Redirects](https://developers.cloudflare.com/pages/platform/redirects/)
- [React Router Documentation](https://reactrouter.com/)
- [Vite Static Asset Handling](https://vitejs.dev/guide/assets.html)

