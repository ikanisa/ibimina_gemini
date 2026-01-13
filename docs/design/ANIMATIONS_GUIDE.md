# Animations & Micro-interactions Guide

**Version:** 1.0  
**Last Updated:** January 2026

---

## Overview

This guide documents the animation system for IBIMINA GEMINI, including page transitions, micro-interactions, loading states, and feedback animations.

---

## Animation Principles

### 1. Performance First
- Use CSS transforms and opacity (GPU-accelerated)
- Avoid animating layout properties (width, height, top, left)
- Keep animations under 300ms for interactions
- Use `will-change` sparingly

### 2. Consistency
- Use design system animation tokens
- Maintain consistent timing and easing
- Follow established patterns

### 3. Accessibility
- Respect `prefers-reduced-motion`
- Provide alternative feedback for animations
- Don't rely solely on animations for information

---

## Animation Utilities

### Location

All animation utilities are in `lib/animations/`:

- `transitions.ts` - Page and component transitions
- `micro-interactions.ts` - Hover, click, focus animations
- `feedback.ts` - Success, error, validation animations
- `index.ts` - Centralized exports

---

## Page Transitions

### Fade Transition

```tsx
import { motion } from 'framer-motion';
import { fadeVariants, defaultTransition } from '@/lib/animations';

<motion.div
  initial="initial"
  animate="animate"
  exit="exit"
  variants={fadeVariants}
  transition={defaultTransition}
>
  {children}
</motion.div>
```

### Slide Transition

```tsx
import { slideVariants } from '@/lib/animations';

<motion.div variants={slideVariants}>
  {children}
</motion.div>
```

### Scale Transition

```tsx
import { scaleVariants } from '@/lib/animations';

<motion.div variants={scaleVariants}>
  {children}
</motion.div>
```

### Using AnimatedPage Component

```tsx
import { AnimatedPage } from '@/components/ui/AnimatedPage';

<AnimatedPage initial="fade" exit="fade">
  {children}
</AnimatedPage>
```

---

## Micro-interactions

### Button Hover

```tsx
import { motion } from 'framer-motion';
import { buttonHoverVariants } from '@/lib/animations';

<motion.button
  whileHover="hover"
  whileTap="tap"
  variants={buttonHoverVariants}
>
  Click Me
</motion.button>
```

### Card Hover

```tsx
import { cardHoverVariants } from '@/lib/animations';

<motion.div
  whileHover="hover"
  variants={cardHoverVariants}
>
  Card Content
</motion.div>
```

### Icon Hover

```tsx
import { iconHoverVariants } from '@/lib/animations';

<motion.div
  whileHover="hover"
  whileTap="tap"
  variants={iconHoverVariants}
>
  <Icon />
</motion.div>
```

### Using AnimatedButton Component

```tsx
import { AnimatedButton } from '@/components/ui/AnimatedButton';

<AnimatedButton 
  variant="primary"
  animateOnHover={true}
  animateOnClick={true}
>
  Click Me
</AnimatedButton>
```

---

## Loading Animations

### Spinner

```tsx
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

<LoadingSpinner size="md" />
```

### Skeleton Loaders

```tsx
import { Skeleton } from '@/components/ui/Skeleton';

<Skeleton className="h-4 w-full" />
```

### Progress Bar

```tsx
import { motion } from 'framer-motion';
import { progressBarVariants } from '@/lib/animations';

<motion.div
  className="h-2 bg-primary-600"
  variants={progressBarVariants}
  initial="initial"
  animate="animate"
/>
```

---

## Form Validation Animations

### Error Shake

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { errorShakeVariants, validationErrorVariants } from '@/lib/animations';

{error && (
  <AnimatePresence>
    <motion.div
      key="error"
      variants={validationErrorVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {error.message}
    </motion.div>
  </AnimatePresence>
)}
```

### Field Error Animation

```tsx
import { motion } from 'framer-motion';
import { errorShakeVariants } from '@/lib/animations';

<motion.input
  variants={errorShakeVariants}
  animate={error ? 'animate' : 'initial'}
  className={error ? 'border-danger-500' : ''}
/>
```

---

## Success/Error Feedback

### Success Animation

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { successVariants } from '@/lib/animations';
import { CheckCircle } from 'lucide-react';

<AnimatePresence>
  {success && (
    <motion.div
      variants={successVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="text-success-600"
    >
      <CheckCircle /> Success!
    </motion.div>
  )}
</AnimatePresence>
```

### Toast Notifications

```tsx
import { motion } from 'framer-motion';
import { toastVariants } from '@/lib/animations';

<motion.div
  variants={toastVariants}
  initial="initial"
  animate="animate"
  exit="exit"
  className="toast"
>
  {message}
</motion.div>
```

---

## Staggered Animations

### List Items

```tsx
import { motion } from 'framer-motion';
import { getStaggerDelay } from '@/lib/animations';

{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    {item.content}
  </motion.div>
))}
```

### Using StaggeredList Component

```tsx
import { StaggeredList } from '@/lib/animations';

<StaggeredList
  animation="slideInUp"
  staggerDelay={50}
>
  {items.map(item => <Item key={item.id} {...item} />)}
</StaggeredList>
```

---

## Animation Timing

### Durations

- **Fast:** 150ms - Quick interactions (hover, tap)
- **Normal:** 200ms - Default transitions
- **Slow:** 300ms - Page transitions, complex animations

### Easing

- **easeOut:** Default for most animations
- **easeInOut:** Smooth transitions
- **spring:** Natural, bouncy animations

---

## Accessibility

### Respecting Reduced Motion

```tsx
import { useReducedMotion } from 'framer-motion';

const shouldReduceMotion = useReducedMotion();

<motion.div
  animate={shouldReduceMotion ? {} : { scale: 1.1 }}
>
  Content
</motion.div>
```

### CSS Media Query

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Best Practices

### Do's

✅ Use animations to provide feedback  
✅ Keep animations subtle and purposeful  
✅ Use consistent timing and easing  
✅ Test with reduced motion preferences  
✅ Animate transform and opacity properties  

### Don'ts

❌ Don't animate layout properties  
❌ Don't use animations that are too fast or too slow  
❌ Don't animate everything  
❌ Don't ignore accessibility preferences  
❌ Don't use animations to hide performance issues  

---

## Common Patterns

### Modal/Drawer Entrance

```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.2 }}
>
  Modal Content
</motion.div>
```

### Dropdown Menu

```tsx
<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.15 }}
>
  Menu Items
</motion.div>
```

### Tab Content

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={activeTab}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.2 }}
  >
    {tabContent}
  </motion.div>
</AnimatePresence>
```

---

## Resources

- **Animation Utilities:** `lib/animations/`
- **Framer Motion Docs:** https://www.framer.com/motion/
- **Design Tokens:** `lib/design-tokens.ts`
- **Components:** `components/ui/AnimatedPage.tsx`, `components/ui/AnimatedButton.tsx`

---

**Document Owner:** Frontend Team  
**Last Updated:** January 2026
