# Mobile Optimization Guide

**Version:** 1.0  
**Last Updated:** January 2026

---

## Overview

This guide documents mobile optimization strategies and best practices for the IBIMINA GEMINI application.

---

## Touch Targets

### Minimum Size

All interactive elements must meet the **minimum touch target size of 44x44px** (WCAG 2.1 AA requirement).

### Implementation

```tsx
// Use TouchTarget component
import { TouchTarget } from '@/components/ui/TouchTarget';

<TouchTarget>
  <button>Click Me</button>
</TouchTarget>

// Or use Tailwind classes
<button className="min-w-[44px] min-h-[44px]">
  Click Me
</button>
```

### Spacing

- Minimum **8px spacing** between touch targets
- Use `gap-2` (8px) or `gap-3` (12px) for button groups

---

## Responsive Design

### Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `xs` | < 640px | Small phones |
| `sm` | 640px+ | Large phones |
| `md` | 768px+ | Tablets |
| `lg` | 1024px+ | Desktops |
| `xl` | 1280px+ | Large desktops |
| `2xl` | 1536px+ | Extra large |

### Using useResponsive Hook

```tsx
import { useResponsive, useIsMobile } from '@/hooks/useResponsive';

function MyComponent() {
  const { isMobile, isTablet, isDesktop, breakpoint } = useResponsive();
  const isMobileOnly = useIsMobile();

  return (
    <div>
      {isMobile ? (
        <MobileLayout />
      ) : (
        <DesktopLayout />
      )}
    </div>
  );
}
```

### Tailwind Responsive Classes

```tsx
<div className="
  text-sm sm:text-base md:text-lg
  p-4 sm:p-6 md:p-8
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
">
  Content
</div>
```

---

## Mobile-Specific Patterns

### Bottom Navigation

Use `MobileBottomNav` component for mobile navigation:

```tsx
import { MobileBottomNav } from '@/components/navigation';

<MobileBottomNav
  items={[
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Users, label: 'Members', path: '/members' },
    // ...
  ]}
/>
```

### Responsive Tables

Use `ResponsiveTable` component for mobile-friendly tables:

```tsx
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';

<ResponsiveTable
  columns={columns}
  data={data}
  mobileView="cards" // or "stacked"
/>
```

### Mobile Drawer/Menu

```tsx
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-neutral-800 z-50"
    >
      Drawer content
    </motion.div>
  )}
</AnimatePresence>
```

---

## Performance Optimizations

### Image Optimization

```tsx
import { optimizeImageForMobile } from '@/lib/mobile/optimizations';

const imageProps = optimizeImageForMobile('/image.jpg', {
  widths: [320, 640, 1024],
  sizes: '(max-width: 640px) 100vw, 50vw',
  loading: 'lazy',
});

<img {...imageProps} alt="Description" />
```

### Lazy Loading

```tsx
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

### Virtual Scrolling

For long lists on mobile, use virtual scrolling:

```tsx
import { VirtualizedTableBody } from '@/components/ui/VirtualizedTableBody';

<VirtualizedTableBody
  items={items}
  renderItem={(item) => <ItemRow item={item} />}
/>
```

---

## Touch Interactions

### Prevent Double-Tap Zoom

```tsx
import { useEffect, useRef } from 'react';
import { preventDoubleTapZoom } from '@/lib/mobile/optimizations';

function MyComponent() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      return preventDoubleTapZoom(ref.current);
    }
  }, []);

  return <div ref={ref}>Content</div>;
}
```

### Swipe Gestures

Use Framer Motion for swipe gestures:

```tsx
import { motion, useDragControls } from 'framer-motion';

<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  onDragEnd={(event, info) => {
    if (info.offset.x > 100) {
      // Swipe right action
    }
  }}
>
  Swipeable content
</motion.div>
```

---

## Safe Area Insets

### Notched Devices

For devices with notches (iPhone X+, etc.):

```css
/* Use CSS variables */
.element {
  padding-top: var(--safe-area-inset-top);
  padding-bottom: var(--safe-area-inset-bottom);
  padding-left: var(--safe-area-inset-left);
  padding-right: var(--safe-area-inset-right);
}
```

```tsx
import { getSafeAreaInsets } from '@/lib/mobile/optimizations';

const insets = getSafeAreaInsets();
<div style={{ paddingTop: insets.top }}>
  Content
</div>
```

---

## Form Optimization

### Mobile Input Types

```tsx
// Use appropriate input types
<input type="tel" />      // Phone numbers
<input type="email" />    // Email addresses
<input type="number" />   // Numbers
<input type="date" />     // Date picker
<input type="search" />   // Search inputs
```

### Input Sizing

```tsx
<input className="
  w-full
  text-base  /* Prevents zoom on iOS */
  px-4 py-3
  min-h-[44px]
" />
```

### Labels Above Inputs

On mobile, place labels above inputs:

```tsx
<div className="flex flex-col gap-2">
  <label>Email</label>
  <input type="email" />
</div>
```

---

## Testing

### Device Testing

Test on real devices:
- iPhone (Safari)
- Android (Chrome)
- iPad (Safari)

### Browser DevTools

Use Chrome DevTools device emulation:
- Toggle device toolbar
- Test different screen sizes
- Test touch interactions
- Test network throttling

### Checklist

- [ ] All touch targets ≥ 44x44px
- [ ] Forms work on mobile
- [ ] Tables are responsive
- [ ] Navigation works on mobile
- [ ] Images are optimized
- [ ] Text is readable (≥ 16px)
- [ ] No horizontal scrolling
- [ ] Safe area insets respected
- [ ] Performance is acceptable (< 3s load)

---

## Best Practices

### Do's

✅ Use mobile-first responsive design  
✅ Ensure touch targets are ≥ 44x44px  
✅ Use appropriate input types  
✅ Optimize images for mobile  
✅ Test on real devices  
✅ Use safe area insets for notched devices  
✅ Provide mobile-specific navigation  

### Don'ts

❌ Don't use hover-only interactions  
❌ Don't make touch targets too small  
❌ Don't use fixed pixel widths  
❌ Don't ignore safe area insets  
❌ Don't rely on desktop-only features  
❌ Don't use small fonts (< 14px)  

---

## Resources

- **Responsive Hook:** `hooks/useResponsive.ts`
- **Mobile Utilities:** `lib/mobile/optimizations.ts`
- **TouchTarget Component:** `components/ui/TouchTarget.tsx`
- **ResponsiveTable Component:** `components/ui/ResponsiveTable.tsx`
- **MobileBottomNav Component:** `components/navigation/MobileBottomNav.tsx`

---

**Document Owner:** Frontend Team  
**Last Updated:** January 2026
