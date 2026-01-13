# Component Guidelines

**Version:** 1.0  
**Last Updated:** January 2026

---

## Overview

This document provides guidelines for creating and using components in the IBIMINA GEMINI design system.

---

## Component Structure

### File Organization

```
components/ui/
  ├── ComponentName.tsx        # Component implementation
  ├── ComponentName.stories.tsx # Storybook stories
  ├── ComponentName.test.tsx    # Unit tests (if applicable)
  └── index.ts                  # Exports
```

### Component Template

```tsx
/**
 * ComponentName Component
 * 
 * Description of what the component does
 */

import React from 'react';
import { cn } from '../../lib/utils/cn';

export interface ComponentNameProps {
  /** Prop description */
  propName?: string;
  /** Additional className */
  className?: string;
  /** Children */
  children?: React.ReactNode;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  propName,
  className,
  children,
}) => {
  return (
    <div className={cn('base-styles', className)}>
      {children}
    </div>
  );
};

export default ComponentName;
```

---

## Design Principles

### 1. Consistency

- Use design tokens for all styling
- Follow established patterns
- Maintain visual consistency

### 2. Accessibility

- Include ARIA attributes
- Support keyboard navigation
- Ensure color contrast
- Provide focus indicators

### 3. Responsiveness

- Mobile-first approach
- Test on multiple screen sizes
- Use responsive utilities

### 4. Performance

- Lazy load when appropriate
- Optimize re-renders
- Use virtual scrolling for lists

---

## Component Patterns

### Buttons

**Variants:**
- `primary` - Main actions
- `secondary` - Secondary actions
- `danger` - Destructive actions
- `ghost` - Subtle actions
- `outline` - Outlined style

**Sizes:**
- `sm` - 32px height
- `md` - 40px height (default)
- `lg` - 48px height

**Requirements:**
- Minimum 44x44px touch target
- Visible focus indicator
- Loading state support
- Disabled state

### Forms

**Components:**
- `FormField` - Wrapper with label and error
- `SimpleInput` - Text input
- `SimpleSelect` - Dropdown select
- `SearchInput` - Search with icon

**Requirements:**
- Associated labels (not placeholders)
- Error message display
- Validation feedback
- Required field indicators

### Cards

**Structure:**
- Header (optional)
- Body (required)
- Footer (optional)

**Usage:**
- Group related content
- Use consistent padding
- Include hover states for interactive cards

### Modals/Dialogs

**Requirements:**
- Focus trap
- Escape key to close
- Backdrop click to close (optional)
- ARIA attributes
- Return focus to trigger

### Tables

**Types:**
- `Table` - Basic table
- `ResponsiveTable` - Mobile-responsive
- `VirtualizedTableBody` - Virtual scrolling for large datasets

**Requirements:**
- Sortable columns (where applicable)
- Accessible headers
- Responsive on mobile
- Loading states

---

## Styling Guidelines

### Use Design Tokens

```tsx
// ✅ Good - Uses design tokens
<div className="bg-primary-600 text-white p-4 rounded-lg">

// ❌ Bad - Hardcoded values
<div className="bg-blue-600 text-white p-4 rounded-lg">
```

### Use Tailwind Classes

```tsx
// ✅ Good - Tailwind utilities
<div className="flex items-center gap-4 p-6">

// ❌ Bad - Inline styles
<div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px' }}>
```

### Use cn() Utility

```tsx
import { cn } from '../../lib/utils/cn';

<div className={cn('base-classes', className, condition && 'conditional-class')}>
```

---

## Accessibility Requirements

### ARIA Attributes

- `aria-label` - For icon-only buttons
- `aria-labelledby` - For elements with visible labels
- `aria-describedby` - For help text or error messages
- `aria-expanded` - For collapsible elements
- `aria-hidden` - For decorative elements

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Tab order should be logical
- Focus indicators must be visible
- Escape key should close modals/dialogs

### Screen Readers

- Use semantic HTML
- Provide descriptive labels
- Announce state changes
- Use `aria-live` for dynamic content

---

## Testing Requirements

### Unit Tests

- Test component rendering
- Test props and variants
- Test user interactions
- Test edge cases

### Storybook Stories

- Document all variants
- Show different states
- Include usage examples
- Document props

### E2E Tests

- Test user workflows
- Test accessibility
- Test responsive behavior

---

## Component Checklist

When creating a new component:

- [ ] Uses design tokens
- [ ] Includes TypeScript types
- [ ] Has Storybook story
- [ ] Accessible (ARIA, keyboard, focus)
- [ ] Responsive
- [ ] Tested
- [ ] Documented
- [ ] Exported in index.ts

---

## Common Patterns

### Loading States

```tsx
{isLoading ? (
  <LoadingSpinner />
) : (
  <Content />
)}
```

### Error States

```tsx
{error ? (
  <ErrorDisplay error={error} />
) : (
  <Content />
)}
```

### Empty States

```tsx
{items.length === 0 ? (
  <EmptyState message="No items found" />
) : (
  <ItemList items={items} />
)}
```

---

## Resources

- **Design Tokens:** `lib/design-tokens.ts`
- **Component Library:** `components/ui/`
- **Storybook:** Run `npm run storybook`
- **Accessibility Guide:** `docs/ACCESSIBILITY_GUIDE.md`

---

**Document Owner:** Frontend Team  
**Last Updated:** January 2026
