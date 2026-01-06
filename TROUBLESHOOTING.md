# Troubleshooting Guide

## "Loading session..." Stuck

If the app is stuck on the "Loading session..." screen, check the following:

### 1. Check Browser Console

Open DevTools → Console tab and look for:
- Red error messages
- Supabase connection errors
- CSP (Content Security Policy) violations
- Network errors

**Common errors:**
- `Missing required environment variables` → Environment variables not set
- `Failed to fetch` → Network/CSP blocking Supabase
- `Error checking session` → Supabase auth issue

### 2. Check Network Tab

Open DevTools → Network tab:
1. Reload the page
2. Look for failed requests (red status codes)
3. Check if requests to `*.supabase.co` are:
   - **Blocked** (CSP violation)
   - **Failed** (network error)
   - **Pending** (timeout)

### 3. Verify Environment Variables in Cloudflare Pages

**Required variables:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

**How to set:**
1. Go to Cloudflare Dashboard
2. Pages → Your Project → Settings → Environment Variables
3. Add variables for **Production** environment
4. **Redeploy** after adding variables (they're build-time, not runtime)

### 4. Test Supabase Connection

Open browser console and run:
```javascript
// Check if Supabase is configured
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing');

// Test connection
const { data, error } = await supabase.auth.getSession();
console.log('Session:', data, 'Error:', error);
```

### 5. Check CSP Headers

If Supabase requests are blocked by CSP:
- Verify `https://*.supabase.co` is in `connect-src` directive
- Check `public/_headers` file
- Look for CSP violation reports in console

### 6. Database/RLS Issues

If session loads but profile doesn't:
- Check if `profiles` table exists
- Verify Row Level Security (RLS) policies allow read access
- Check browser console for database errors

## Quick Fixes

### If Environment Variables Missing

1. Set in Cloudflare Pages dashboard
2. Trigger a new deployment
3. Wait for build to complete
4. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)

### If CSP Blocking

1. Check `public/_headers` file
2. Ensure `connect-src` includes `https://*.supabase.co`
3. Redeploy
4. Clear browser cache

### If Database Query Failing

1. Check Supabase Dashboard → Database → Tables
2. Verify `profiles` table exists
3. Check RLS policies
4. Test query in Supabase SQL Editor

## Still Stuck?

1. **Check build logs** in Cloudflare Pages dashboard
2. **Check runtime errors** in browser console
3. **Test locally** with same environment variables
4. **Check Supabase status** at status.supabase.com

