---
description: Create a clean, production-grade Cloudflare Pages setup for a PWA (monorepo-safe, preview-safe, rollback-ready)
---

# Cloudflare Pages Setup Workflow

// turbo-all

## 1. Dashboard Configuration

Go to **Cloudflare Dashboard → Pages → Create a project**.

### Build Settings

| Setting | Value |
|---------|-------|
| Project name | `sacco` |
| Root directory | `/` |
| Build command | `npm ci && npm run build` |
| Output directory | `dist` |
| Production branch | `main` |

### Environment Variables

Set these in **Settings → Environment variables**:

| Variable | Value | Environments |
|----------|-------|--------------|
| `NODE_VERSION` | `20` | All |
| `VITE_SUPABASE_URL` | Your Supabase URL | All (diff per env) |
| `VITE_SUPABASE_ANON_KEY` | Your anon key | All (diff per env) |

## 2. Verify Required Files

Ensure these files exist in `public/`:

### `public/_redirects`
```
/*    /index.html   200
```

### `public/_headers`
Must include:
- Security headers (CSP, HSTS, X-Frame-Options)
- Cache rules (immutable for hashed assets, no-cache for HTML/SW)

## 3. Test Locally

```bash
npm ci
npm run build
npm run preview
```

Verify:
- App loads at http://localhost:4173
- Deep links work (navigate to /dashboard, refresh)

## 4. Deploy

### Preview (any branch)
```bash
git push origin feature-branch
```

### Production (main branch)
```bash
git checkout main
git push origin main
```

## 5. Verify Deployment

1. Check build status in Cloudflare Dashboard
2. Visit production URL
3. Run Lighthouse audit (target: 90+)
4. Verify security headers with `curl -I`

## 6. Rollback (if needed)

1. Cloudflare Dashboard → Pages → Deployments
2. Find last good deployment
3. Click "..." → "Rollback to this deployment"
