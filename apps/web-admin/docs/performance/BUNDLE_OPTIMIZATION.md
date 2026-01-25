# Bundle Size Optimization Guide

**Version:** 1.0  
**Last Updated:** January 2026

---

## Overview

This guide documents bundle size optimization strategies for IBIMINA GEMINI to ensure fast load times and optimal performance.

---

## Current Bundle Analysis

### Target Sizes

- **Initial bundle:** < 500KB (gzipped)
- **Total bundle:** < 1MB (gzipped)
- **Individual chunks:** < 200KB (gzipped)

### Analysis Tools

```bash
# Build with analysis
npm run build:analyze

# Check bundle size
npm run build
ls -lh dist/assets/
```

---

## Optimization Strategies

### 1. Code Splitting

#### Route-Based Splitting

```tsx
// Use React.lazy() for routes
const Dashboard = lazy(() => import('./components/Dashboard'));
const Transactions = lazy(() => import('./components/Transactions'));
```

#### Component-Based Splitting

```tsx
// Lazy load heavy components
const Chart = lazy(() => import('./components/Chart'));
const Editor = lazy(() => import('./components/Editor'));
```

### 2. Tree Shaking

#### Named Imports

```tsx
// ✅ Good - tree shakeable
import { Button, Card } from '@/components/ui';

// ❌ Bad - imports entire library
import * as UI from '@/components/ui';
```

#### Icon Imports

```tsx
// ✅ Good - import only needed icons
import { Home, Users, Settings } from 'lucide-react';

// ❌ Bad - imports all icons
import * as Icons from 'lucide-react';
```

### 3. Dynamic Imports

```tsx
// Dynamic import for heavy libraries
const loadChart = () => import('recharts');

// Use when needed
const Chart = await loadChart();
```

### 4. Vendor Chunk Splitting

Configure in `vite.config.ts`:

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        'query-vendor': ['@tanstack/react-query'],
        'ui-vendor': ['framer-motion', 'lucide-react'],
      },
    },
  },
}
```

---

## Large Dependencies

### Optimization Opportunities

1. **recharts** (~200KB)
   - Consider lighter alternatives (Chart.js, Victory)
   - Lazy load chart components
   - Use dynamic imports

2. **framer-motion** (~50KB)
   - Lazy load animated components
   - Use CSS animations where possible
   - Import only needed features

3. **lucide-react** (~100KB)
   - Import icons individually
   - Use tree shaking
   - Consider icon subset

4. **@supabase/supabase-js** (~150KB)
   - Lazy load Supabase client
   - Use dynamic imports
   - Split by feature

---

## Best Practices

### Do's

✅ Use React.lazy() for routes  
✅ Import only what you need  
✅ Use dynamic imports for heavy libraries  
✅ Split vendor chunks  
✅ Monitor bundle size regularly  

### Don'ts

❌ Don't import entire libraries  
❌ Don't bundle unused code  
❌ Don't ignore bundle size  
❌ Don't use large dependencies unnecessarily  
❌ Don't skip code splitting  

---

## Monitoring

### Build Analysis

```bash
# Analyze bundle
npm run build:analyze

# Check sizes
npm run build && du -sh dist/assets/*
```

### Bundle Size Limits

Set in `package.json`:

```json
{
  "bundlesize": [
    {
      "path": "./dist/assets/*.js",
      "maxSize": "500kb"
    }
  ]
}
```

---

## Resources

- **Vite Config:** `vite.config.ts`
- **Bundle Analysis Script:** `scripts/analyze-bundle.js`
- **Vite Bundle Analysis:** https://vitejs.dev/guide/build.html#bundle-analyzer

---

**Document Owner:** Frontend Team  
**Last Updated:** January 2026
