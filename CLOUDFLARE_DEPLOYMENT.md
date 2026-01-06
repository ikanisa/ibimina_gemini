# Cloudflare Pages Deployment Guide

## Build Configuration

### Framework Preset
**Select:** `Vite` (if available) or `None`

### Build Command
```
npm run build
```

### Build Output Directory
```
dist
```

### Root Directory (Advanced)
Leave empty (default: `/`)

## Environment Variables

Add these environment variables in Cloudflare Pages settings:

### Required Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-key` | Your Supabase anonymous/public key |
| `VITE_USE_MOCK_DATA` | `false` | Set to false for production |

### Optional Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `GEMINI_API_KEY` | `your-gemini-key` | Only needed if using AI features (OCR) |
| `NODE_VERSION` | `18` or `20` | Node.js version (default: 18) |

## Production Branch

**Branch:** `main`

## Build Settings Summary

```
Framework preset: Vite (or None)
Build command: npm run build
Build output directory: dist
Root directory: / (leave empty)
Production branch: main
```

## Post-Deployment Checklist

- [ ] Verify environment variables are set correctly
- [ ] Test the deployed site at `sacco1.pages.dev`
- [ ] Verify Supabase connection works
- [ ] Test PWA installation
- [ ] Verify service worker is working
- [ ] Test on mobile devices
- [ ] Verify all routes work (SPA routing)

## Custom Domain (Optional)

If you want to use a custom domain:
1. Go to Cloudflare Pages → Your Project → Custom Domains
2. Add your domain
3. Update DNS records as instructed

## Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

### Environment Variables Not Working
- Ensure variables start with `VITE_` for Vite to expose them
- Restart build after adding variables
- Check variable names match exactly

### Routing Issues
- Ensure `public/_redirects` file exists for SPA routing
- Verify Cloudflare Pages SPA routing is enabled

