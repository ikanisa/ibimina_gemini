# Release Checklist

> **Mission**: Make deployment boring (boring is good).

## Pre-Deployment

### Code Quality
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes (no warnings)
- [ ] `npm run test` passes

### Build Verification
```bash
rm -rf dist node_modules
npm ci
npm run build
npm run preview  # Test locally at http://localhost:4173
```

- [ ] Build completes without errors
- [ ] Preview app loads correctly
- [ ] Test deep link: Navigate to `/dashboard`, refresh → works (no 404)

### Environment Check
- [ ] Verify `VITE_SUPABASE_URL` is set in Cloudflare Dashboard
- [ ] Verify `VITE_SUPABASE_ANON_KEY` is set in Cloudflare Dashboard
- [ ] Verify `NODE_VERSION=20` is set in Cloudflare Dashboard

---

## Deployment

### Push to Production
```bash
git checkout main
git pull origin main
git push origin main
```

Cloudflare Pages will automatically build and deploy.

### Monitor Build
1. Go to **Cloudflare Dashboard → Pages → sacco → Deployments**
2. Watch the build log for errors
3. Wait for "Success" status

---

## Post-Deployment Verification

### Functionality
- [ ] Visit production URL → App loads (no white screen)
- [ ] Login works
- [ ] Navigate to key pages (Dashboard, Members, Groups)
- [ ] Logout works

### PWA
- [ ] Open DevTools → Application → Service Worker → Registered
- [ ] Check "Update on reload" and refresh → New SW activates

### Performance
- [ ] Run Lighthouse audit → Score > 90
- [ ] Check Network tab → Assets have correct cache headers

### Security Headers
```bash
curl -I https://your-app.pages.dev | grep -E "(X-Frame|X-Content|Content-Security)"
```
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Content-Security-Policy: present

---

## Rollback Procedure

### When to Rollback
- White screen / app won't load
- Critical feature broken
- Security vulnerability discovered

### How to Rollback (< 1 minute)

1. **Cloudflare Dashboard** → Pages → sacco → Deployments
2. Find the **last known good deployment**
3. Click **"..."** → **"Rollback to this deployment"**
4. Confirm rollback
5. Verify app loads correctly

### If Rollback Doesn't Fix It

| Check | Action |
|-------|--------|
| Database | Review recent RLS/schema changes in Supabase |
| Edge Functions | Check Supabase Edge Function logs |
| Environment | Verify all env vars are set in Cloudflare Dashboard |

---

## Emergency Contacts

| Role | Contact |
|------|---------|
| DevOps | [Add contact] |
| Backend | [Add contact] |
| Product | [Add contact] |
