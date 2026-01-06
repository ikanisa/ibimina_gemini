# Cloudflare Pages Configuration

## Quick Setup Instructions

Copy these settings into your Cloudflare Pages project configuration:

### Build Settings

**Framework preset:** `Vite` (or `None` if Vite preset not available)

**Build command:**
```bash
npm run build
```

**Build output directory:**
```
dist
```

**Root directory (advanced):**
```
/
```
(Leave empty or use `/`)

**Production branch:**
```
main
```

### Environment Variables

Add these in Cloudflare Pages → Settings → Environment Variables:

#### Production Environment

```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY = your-supabase-anon-key
VITE_USE_MOCK_DATA = false
NODE_VERSION = 18
```

#### Optional (if using AI features)

```
GEMINI_API_KEY = your-gemini-api-key
```

### Build Configuration Details

- **Node.js Version:** 18 (or 20)
- **Package Manager:** npm (default)
- **Build Timeout:** Default (15 minutes should be sufficient)

### Post-Deployment

After deployment, verify:
1. Site loads at `sacco1.pages.dev`
2. Supabase connection works (check browser console)
3. PWA service worker registers
4. All routes work (try navigating)
5. Mobile responsiveness works

### Custom Domain Setup

1. Go to Cloudflare Pages → Your Project → Custom Domains
2. Add your domain
3. Follow DNS setup instructions
4. SSL will be automatically provisioned

