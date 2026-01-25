# CDN Optimization Guide

**Version:** 1.0  
**Last Updated:** January 2026

---

## Overview

This guide documents CDN optimization strategies for IBIMINA GEMINI deployed on Cloudflare Pages.

---

## Cloudflare CDN Configuration

### Caching Rules

Configure in `public/_headers`:

```
# Static assets - long cache
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# HTML - short cache
/*.html
  Cache-Control: public, max-age=0, must-revalidate

# API routes - no cache
/api/*
  Cache-Control: no-cache, no-store, must-revalidate
```

### Compression

Cloudflare automatically compresses:
- HTML
- CSS
- JavaScript
- JSON
- SVG

### Browser Caching

Set appropriate cache headers:
- **Static assets:** 1 year (immutable)
- **HTML:** No cache (always revalidate)
- **API responses:** No cache

---

## Performance Optimizations

### 1. Asset Optimization

- **Minify:** JavaScript and CSS minified in build
- **Compress:** Gzip/Brotli compression enabled
- **Optimize images:** Use WebP format, lazy loading

### 2. HTTP/2 and HTTP/3

Cloudflare automatically enables:
- HTTP/2
- HTTP/3 (QUIC)
- Server push (where applicable)

### 3. Edge Caching

- **Static assets:** Cached at edge
- **HTML:** Cached with revalidation
- **API:** Not cached (passed through)

---

## Cloudflare Features

### 1. Auto Minify

Enable in Cloudflare dashboard:
- JavaScript
- CSS
- HTML

### 2. Rocket Loader

Enable for faster JavaScript loading (optional).

### 3. Mirage

Enable for image optimization (optional).

### 4. Polish

Enable for image compression (optional).

---

## Cache Invalidation

### Manual Invalidation

```bash
# Using Cloudflare API
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

### Automatic Invalidation

On deployment, Cloudflare Pages automatically:
- Invalidates HTML cache
- Keeps static asset cache (immutable)

---

## Monitoring

### Cloudflare Analytics

Monitor:
- Cache hit rate
- Bandwidth usage
- Request count
- Response times

### Performance Metrics

Track:
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)

---

## Best Practices

### Do's

✅ Use immutable cache for static assets  
✅ Enable compression  
✅ Optimize images  
✅ Use CDN for all static assets  
✅ Monitor cache hit rates  

### Don'ts

❌ Don't cache API responses  
❌ Don't cache user-specific data  
❌ Don't ignore cache headers  
❌ Don't skip compression  
❌ Don't forget to invalidate on updates  

---

## Resources

- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages/
- **Cache Headers:** `public/_headers`
- **Deployment Guide:** `docs/CLOUDFLARE_DEPLOYMENT_SETUP.md`

---

**Document Owner:** DevOps Team  
**Last Updated:** January 2026
