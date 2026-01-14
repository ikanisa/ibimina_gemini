---
description: Configure Cloudflare Pages correctly for monorepos (one Pages project per deployable app)
---

# Cloudflare Pages Monorepo Workflow

// turbo-all

## Overview

This workflow ensures correct Cloudflare Pages configuration for monorepo architectures. The golden rule: **one Pages project per deployable app**.

---

## 1. Audit Current Structure

Before configuring, identify all deployable apps in your monorepo:

```bash
# List all package.json files that have a "build" script
find . -name "package.json" -not -path "./node_modules/*" -exec grep -l '"build"' {} \;
```

### Monorepo Patterns

| Pattern | Example | Pages Projects Needed |
|---------|---------|----------------------|
| Single app at root | `ibimina_gemini` | 1 project |
| Apps folder | `apps/staff`, `apps/admin` | 2 projects |
| Shared packages | `packages/ui` | 0 (not deployed directly) |

---

## 2. Dashboard Settings Per App

For each deployable app, create a separate Pages project:

### Project Configuration

| Setting | Single App | Monorepo App |
|---------|-----------|--------------|
| **Root directory** | `/` | `/apps/app-name` |
| **Build command** | `npm ci && npm run build` | `npm ci && npm run build` (from root) |
| **Output directory** | `dist` | `dist` (relative to root dir) |
| **Production branch** | `main` | `main` |

### Environment Variables (per project)

Set in **Settings → Environment variables**:

| Variable | Notes |
|----------|-------|
| `NODE_VERSION` | `20` (or match `.nvmrc`) |
| `NPM_FLAGS` | `--legacy-peer-deps` if needed |
| `VITE_*` | Build-time only (no secrets!) |

> [!CAUTION]
> Never put secrets in `VITE_*` variables—they are embedded in the bundle!

---

## 3. Monorepo Build Commands

### Turborepo/Nx Pattern

```bash
# Build only the app being deployed
npx turbo run build --filter=@scope/app-name
```

### pnpm Workspaces

```bash
# Install all deps, build specific app
pnpm install && pnpm --filter @scope/app-name build
```

### npm Workspaces

```bash
# From root
npm ci && npm run build --workspace=apps/app-name
```

---

## 4. Required Files Per App

Each deployable app MUST have in its `public/` folder:

### `public/_redirects`
```
/*    /index.html   200
```

### `public/_headers`
Must include:
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- Cache headers (immutable for hashed assets, no-cache for HTML/SW)

See `/cloudflare-pages-headers-security` workflow for complete example.

---

## 5. Preview vs Production Discipline

### Branch Mapping

| Branch | Environment | URL Pattern |
|--------|-------------|-------------|
| `main` | Production | `project-name.pages.dev` |
| Feature branches | Preview | `branch-name.project-name.pages.dev` |

### Environment Variable Overrides

In Cloudflare Dashboard, you can set different values for:
- **Production**: Variables for production builds
- **Preview**: Variables for all non-production branches

> [!IMPORTANT]
> Always test preview deployments before merging to main!

---

## 6. Verify Configuration

### Local Build Test

```bash
# Simulate Cloudflare build exactly
npm ci
npm run build
npm run preview
```

### Verify Checklist

- [ ] Build succeeds locally
- [ ] Output in correct `dist/` folder
- [ ] `_redirects` and `_headers` copied to dist
- [ ] No secrets in bundle (check with `grep -r "secret" dist/`)
- [ ] Deep links work (navigate to /dashboard, refresh)

### Post-Deploy Verification

```bash
# Check headers
curl -I https://your-app.pages.dev

# Verify SPA routing
curl -s https://your-app.pages.dev/some/deep/route | head -20
```

---

## 7. Common Issues

### Wrong Output Directory

**Symptom**: 404 on all routes after deploy.

**Fix**: Ensure output directory matches your build output (usually `dist`).

### Stale Assets After Deploy

**Symptom**: Old JavaScript still served after deploy.

**Fix**: Ensure `index.html` has `no-cache` headers. See `/cloudflare-pages-cache-stale` workflow.

### Preview/Prod Environment Mismatch

**Symptom**: Works in preview, breaks in production.

**Fix**: Check environment variable overrides in Dashboard.

---

## 8. Release Checklist

Before deploying to production:

1. [ ] All tests pass locally
2. [ ] Preview deployment tested
3. [ ] Environment variables verified (prod values set)
4. [ ] Bundle size checked (no unexpected bloat)
5. [ ] Lighthouse score ≥ 90
6. [ ] Security headers verified with `curl -I`

---

## 9. Rollback Plan

If production breaks after deploy:

1. Go to **Cloudflare Dashboard → Pages → Deployments**
2. Find the last good deployment
3. Click **"..." → "Rollback to this deployment"**
4. Verify rollback successful
5. Investigate issue on a feature branch

> [!TIP]
> Rollbacks are instant in Cloudflare Pages—no new build required!

---

## Related Workflows

- `/cloudflare-pages-setup` — Initial production-grade setup
- `/cloudflare-pages-env-vars` — Environment variable best practices
- `/cloudflare-pages-headers-security` — Security and cache headers
- `/cloudflare-pages-spa-routing` — SPA routing fixes
- `/cloudflare-pages-cache-stale` — Fix stale asset issues
- `/cloudflare-pages-rollback` — Emergency rollback playbook
