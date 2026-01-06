# Cloudflare Production Readiness Audit

## Deployment Shape Decision

**Selected: Option A - Pages Only (Static SPA/PWA)**

### Rationale
- ✅ Frontend-only React SPA built with Vite
- ✅ Backend is external (Supabase API)
- ✅ No edge functions or Workers in this repo
- ✅ Builds to static assets (`dist/`)
- ✅ PWA with service worker (handled by vite-plugin-pwa)

### Architecture
```
Frontend (Pages) → Supabase API (External)
                 → Supabase Edge Functions (External, deployed separately)
```

**Note:** Supabase Edge Functions (`ocr-extract`, `staff-invite`) are deployed separately in Supabase, not on Cloudflare.

## Frontend App Identification

### Framework & Build
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 6.2.0
- **Build Command:** `npm run build`
- **Output Directory:** `dist/`
- **SPA Routing:** Yes (React Router)
- **PWA:** Yes (vite-plugin-pwa)

### Build Output Structure
```
dist/
├── index.html
├── assets/
│   ├── *.js (hashed)
│   ├── *.css (hashed)
│   └── *.png (icons)
├── sw.js (service worker)
├── manifest.webmanifest
├── _redirects (SPA routing)
├── _headers (security headers)
└── 404.html (fallback)
```

## Backend/Edge Code Analysis

### No Cloudflare Workers/Functions
- ❌ No `/functions/` directory
- ❌ No `wrangler.toml` configuration
- ❌ No Workers runtime code

### External Services
- **Supabase:** Database + Auth + Storage (external API)
- **Supabase Edge Functions:** Deployed separately in Supabase
  - `ocr-extract` - OCR processing with Gemini
  - `staff-invite` - Staff invitation

## Environment Variables Matrix

### Build-Time Variables (Vite)

| Variable | Dev | Preview | Production | Notes |
|----------|-----|---------|------------|-------|
| `VITE_SUPABASE_URL` | Local Supabase | Preview Supabase | Production Supabase | Required |
| `VITE_SUPABASE_ANON_KEY` | Local key | Preview key | Production key | Required, public |
| `VITE_USE_MOCK_DATA` | `true` (optional) | `false` | `false` | Optional |
| `NODE_VERSION` | `18` | `18` | `18` | Build environment |

### Runtime Variables (Not Used)
- No Workers/Functions means no runtime env vars needed
- All config is build-time via `VITE_*` variables

### Secrets Handling
- ✅ `GEMINI_API_KEY` is used server-side in Supabase Functions (not in frontend)
- ✅ No secrets in frontend code
- ✅ All `VITE_*` variables are public (by design)

## Cloudflare Deployment Plan

### 1. Pages Configuration

**Project Settings:**
- Framework preset: `Vite` (or `None`)
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/` (empty)
- Production branch: `main`
- Node version: `18` (via `.nvmrc`)

### 2. Required Files

#### ✅ Already Created
- `public/_redirects` - SPA routing
- `public/_headers` - Security headers (needs enhancement)
- `.nvmrc` - Node version pinning

#### ⚠️ Needs Creation/Enhancement
- `public/404.html` - Custom 404 page
- Enhanced `_headers` with CSP
- `.env.example` - Environment variable template

### 3. Security Headers Enhancement

Current `_headers` needs:
- ✅ Content-Security-Policy (CSP) - **MISSING**
- ✅ X-Frame-Options - Present
- ✅ X-Content-Type-Options - Present
- ✅ Referrer-Policy - Present
- ✅ Permissions-Policy - Present
- ✅ HSTS - Should be added (with caution)

### 4. Routing Configuration

**SPA Routing:**
- `_redirects` file: `/* /index.html 200`
- Ensures all routes serve index.html
- Static assets bypass redirect

### 5. Caching Strategy

**Current:**
- ✅ Hashed assets: Long cache (immutable)
- ✅ HTML: No cache
- ✅ Service worker: No cache

**Needs Verification:**
- Ensure Vite generates hashed filenames
- Verify cache headers work correctly

## Risks & Mitigations

### Risk 1: CSP Breaking Functionality
**Mitigation:** Start with permissive CSP, tighten gradually
- Use `report-uri` to monitor violations
- Test all features after CSP implementation

### Risk 2: Service Worker Caching Issues
**Mitigation:** 
- Ensure service worker updates correctly
- Test offline functionality
- Monitor service worker registration

### Risk 3: Environment Variable Exposure
**Mitigation:**
- ✅ All `VITE_*` vars are intentionally public
- ✅ No secrets in frontend
- ✅ Supabase RLS provides security

### Risk 4: Build Failures
**Mitigation:**
- Pin Node version (`.nvmrc`)
- Commit `package-lock.json`
- Test builds locally before deployment

## Implementation Checklist

### Phase 1: Core Configuration ✅
- [x] Choose deployment shape (A: Pages only)
- [x] Document architecture decision
- [x] Create `.nvmrc` for Node version
- [x] Create `_redirects` for SPA routing
- [x] Create basic `_headers`

### Phase 2: Security Hardening
- [ ] Enhance `_headers` with CSP
- [ ] Create `404.html` fallback
- [ ] Test security headers
- [ ] Document CSP policy

### Phase 3: Environment Variables
- [ ] Create `.env.example`
- [ ] Document env var matrix
- [ ] Verify Cloudflare Pages env vars setup
- [ ] Test build with production env vars

### Phase 4: CI/CD
- [ ] Add GitHub Actions for PR checks
- [ ] Configure preview deployments
- [ ] Set up production deployment gates
- [ ] Document rollback procedure

### Phase 5: Testing & Validation
- [ ] Test SPA deep links
- [ ] Verify PWA installation
- [ ] Test service worker updates
- [ ] Validate security headers
- [ ] Performance audit

## Next Steps

1. **Immediate:** Enhance `_headers` with CSP
2. **Immediate:** Create `404.html`
3. **Immediate:** Create `.env.example`
4. **Short-term:** Set up CI/CD
5. **Short-term:** Performance optimization
6. **Ongoing:** Monitor and iterate

## References

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Pages Redirects](https://developers.cloudflare.com/pages/platform/redirects/)
- [Pages Headers](https://developers.cloudflare.com/pages/platform/headers/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

