# Production Readiness Checklist

Use this checklist before deploying Ibimina to production.

## Environment Configuration

### Required Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | ✓ |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | ✓ |
| `VITE_SENTRY_DSN` | Sentry error tracking DSN | Recommended |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_USE_MOCK_DATA` | `false` | **NEVER set to `true` in production** |
| `VITE_FEATURE_SMS_GATEWAY` | `true` | Enable SMS gateway integration |
| `VITE_FEATURE_MFA` | `true` | Enable MFA support |
| `VITE_FEATURE_REALTIME` | `true` | Enable realtime updates |

### Validation

Run environment validation programmatically:

```typescript
import { validateEnv } from '@/core/config/env';

const result = validateEnv();
if (!result.isValid) {
  console.error('Environment errors:', result.errors);
  // Block app startup in production
}
```

## Pre-Deployment Checklist

### Build Verification

- [ ] `npm run typecheck` passes with no errors
- [ ] `npm run lint` passes with no errors  
- [ ] `npm run test` passes (all critical tests)
- [ ] `npm run build` completes successfully
- [ ] Build output is < 2MB total (gzipped)

### Security

- [ ] `VITE_USE_MOCK_DATA` is NOT set or is `false`
- [ ] All API keys are production values (not dev/staging)
- [ ] Supabase RLS policies are enabled
- [ ] No hardcoded credentials in source code
- [ ] CORS origins are properly configured in Supabase

### Database

- [ ] All required indexes are created (see [DATABASE_INDEXES.md](./DATABASE_INDEXES.md))
- [ ] RLS policies reviewed and tested
- [ ] Migrations applied to production database
- [ ] Database backup strategy in place

### Performance

- [ ] Bundle analyzer reviewed for large dependencies
- [ ] No unused dependencies in bundle
- [ ] Images optimized (WebP with fallbacks)
- [ ] Lazy loading for heavy components

### PWA

- [ ] Service worker registering correctly
- [ ] Manifest.json valid (test with Lighthouse)
- [ ] App icons at all required sizes
- [ ] Offline fallback page works

### Monitoring

- [ ] Sentry configured and receiving test error
- [ ] Supabase logs accessible
- [ ] Uptime monitoring configured

## Deployment Platforms

### Cloudflare Pages

```bash
# Build command
npm run build

# Output directory
dist

# Required env vars (set in Pages settings):
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Vercel

```toml
# vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

## Post-Deployment Verification

1. **Smoke Test**: Visit the deployed URL, verify login works
2. **API Connectivity**: Confirm Supabase calls succeed
3. **PWA Install**: Try installing the app on mobile
4. **Error Reporting**: Trigger a test error, verify Sentry receives it
5. **Performance**: Run Lighthouse audit (target 90+ on all scores)

## Rollback Procedure

1. Identify the last working deployment
2. In Cloudflare Pages: Rollback to previous deployment
3. Verify the rolled-back version works
4. Investigate the issue in staging before re-deploying

## Monitoring Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/YOUR_PROJECT
- **Cloudflare Pages**: https://dash.cloudflare.com/pages
- **Sentry**: https://sentry.io/organizations/YOUR_ORG/issues/
