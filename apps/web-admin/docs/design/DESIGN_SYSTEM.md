# Design System Documentation

**Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Active

---

## Overview

The IBIMINA GEMINI Design System provides a comprehensive set of design tokens, components, and guidelines to ensure consistency, accessibility, and maintainability across the application.

---

## Design Tokens

### Colors

Design tokens are defined in `lib/design-tokens.ts` and `lib/a11y-colors.ts`.

#### Primary Colors

```typescript
primary: {
  50: '#eff6ff',  // Lightest
  100: '#dbeafe',
  500: '#3b82f6', // Main
  600: '#2563eb', // Preferred for text
  700: '#1d4ed8',
}
```

**Usage:**
- Primary actions (buttons, links)
- Interactive elements
- Brand identity

#### Semantic Colors

**Success (Green):**
- `success.500`: `#22c55e` - Main success color
- `success.600`: `#16a34a` - Text/icon color
- Used for: Success messages, positive actions, completed states

**Warning (Amber):**
- `warning.500`: `#f59e0b` - Main warning color
- `warning.600`: `#d97706` - Text/icon color
- Used for: Warnings, caution states, pending actions

**Danger (Red):**
- `danger.500`: `#ef4444` - Main danger color
- `danger.600`: `#dc2626` - Text/icon color
- Used for: Errors, destructive actions, critical alerts

**Neutral (Slate):**
- `neutral.50` to `neutral.900` - Grayscale palette
- Used for: Text, backgrounds, borders, dividers

#### Accessibility

All colors meet **WCAG 2.1 AA** contrast requirements:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

See `lib/a11y-colors.ts` for accessible color utilities.

---

### Typography

#### Font Families

```typescript
fontFamily: {
  sans: ['Inter', 'sans-serif'],  // Primary font
  mono: ['Menlo', 'Monaco', 'monospace'],  // Code/monospace
}
```

**Usage:**
- **Inter**: All UI text, headings, body copy
- **Monospace**: Code snippets, technical data

#### Font Sizes

```typescript
fontSize: {
  xs: '0.75rem',    // 12px - Labels, captions
  sm: '0.875rem',   // 14px - Secondary text
  base: '1rem',     // 16px - Body text
  lg: '1.125rem',   // 18px - Subheadings
  xl: '1.25rem',    // 20px - Section headings
  '2xl': '1.5rem',  // 24px - Page titles
  '3xl': '1.875rem', // 30px - Hero text
}
```

#### Font Weights

```typescript
fontWeight: {
  normal: 400,    // Body text
  medium: 500,    // Emphasis
  semibold: 600,  // Headings
  bold: 700,      // Strong emphasis
}
```

#### Line Heights

```typescript
lineHeight: {
  tight: 1.25,    // Headings
  normal: 1.5,    // Body text
  relaxed: 1.75,  // Long-form content
}
```

---

### Spacing

Spacing uses an 8px base unit system:

```typescript
spacing: {
  xs: '0.5rem',   // 8px
  sm: '0.75rem',  // 12px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
}
```

**Usage Guidelines:**
- Use consistent spacing multiples (8px, 16px, 24px, 32px)
- Maintain visual rhythm
- Use larger spacing for section separation
- Use smaller spacing for related elements

---

### Border Radius

```typescript
borderRadius: {
  sm: '0.25rem',  // 4px - Small elements
  md: '0.5rem',   // 8px - Default
  lg: '0.75rem',  // 12px - Cards, panels
  xl: '1rem',     // 16px - Large containers
}
```

**Usage:**
- **sm**: Buttons, badges, small inputs
- **md**: Default for most elements
- **lg**: Cards, modals, panels
- **xl**: Large containers, hero sections

---

### Shadows

```typescript
shadows: {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',      // Subtle elevation
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',   // Default elevation
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)', // High elevation
}
```

**Usage:**
- **none**: Flat elements
- **sm**: Hover states, subtle cards
- **md**: Default cards, dropdowns
- **lg**: Modals, popovers, elevated panels

---

### Transitions

```typescript
transitions: {
  fast: '150ms',   // Quick interactions
  normal: '200ms', // Default
  slow: '300ms',   // Smooth transitions
}
```

**Easing Functions:**
```typescript
easing: {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy
}
```

---

### Z-Index Scale

```typescript
zIndex: {
  dropdown: 10,   // Dropdowns, tooltips
  sticky: 20,    // Sticky headers
  modal: 30,     // Modals, dialogs
  overlay: 40,   // Overlays, backdrops
  toast: 50,     // Toast notifications
}
```

---

### Breakpoints

```typescript
breakpoints: {
  sm: '640px',   // Small tablets
  md: '768px',   // Tablets
  lg: '1024px',  // Desktops
  xl: '1280px',  // Large desktops
  '2xl': '1536px', // Extra large
}
```

**Usage:**
- Mobile-first approach
- Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`

---

## Component Library

### Core Components

All components are located in `components/ui/`:

#### Buttons

**File:** `components/ui/Button.tsx`

**Variants:**
- `primary` - Main actions
- `secondary` - Secondary actions
- `danger` - Destructive actions
- `ghost` - Subtle actions
- `outline` - Outlined style

**Sizes:**
- `sm` - Small (32px height)
- `md` - Medium (40px height, default)
- `lg` - Large (48px height)

**Usage:**
```tsx
import { Button } from './components/ui/Button';

<Button variant="primary" size="md">Click Me</Button>
```

#### Forms

**File:** `components/ui/FormField.tsx`

**Features:**
- Label association
- Error messages
- Help text
- Required indicators

**Usage:**
```tsx
import { FormField } from './components/ui/FormField';

<FormField
  label="Email"
  error={errors.email}
  required
>
  <input type="email" />
</FormField>
```

#### Cards

**File:** `components/ui/Card.tsx`

**Usage:**
```tsx
import { Card } from './components/ui/Card';

<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>
```

#### Modals

**File:** `components/ui/Modal.tsx`

**Features:**
- Focus trap
- Escape key to close
- Backdrop click to close
- ARIA attributes

**Usage:**
```tsx
import { Modal } from './components/ui/Modal';

<Modal isOpen={isOpen} onClose={onClose} title="Modal Title">
  Content
</Modal>
```

#### Tables

**Files:**
- `components/ui/Table.tsx` - Basic table
- `components/ui/ResponsiveTable.tsx` - Mobile-responsive
- `components/ui/VirtualizedTableBody.tsx` - Virtual scrolling

**Usage:**
```tsx
import { Table } from './components/ui/Table';

<Table>
  <Table.Header>
    <Table.Row>
      <Table.Head>Name</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {/* Rows */}
  </Table.Body>
</Table>
```

---

## Usage Guidelines

### Color Usage

1. **Primary Actions:** Use `primary.600` for main CTAs
2. **Text:** Use `neutral.800` for primary text, `neutral.600` for secondary
3. **Backgrounds:** Use `neutral.50` for page backgrounds, `white` for cards
4. **Borders:** Use `neutral.200` for subtle borders, `neutral.300` for stronger

### Typography Hierarchy

1. **Page Title:** `text-3xl font-bold` (h1)
2. **Section Heading:** `text-2xl font-semibold` (h2)
3. **Subsection:** `text-xl font-medium` (h3)
4. **Body Text:** `text-base font-normal` (p)
5. **Caption:** `text-sm text-neutral-500` (small)

### Spacing Patterns

1. **Component Padding:** `p-4` (16px) default, `p-6` (24px) for cards
2. **Section Spacing:** `space-y-6` (24px) between sections
3. **Form Spacing:** `space-y-4` (16px) between form fields
4. **List Spacing:** `space-y-2` (8px) for tight lists

### Component Composition

1. **Consistency:** Use design system components, not custom implementations
2. **Composition:** Build complex UIs from simple components
3. **Accessibility:** Always include ARIA labels and semantic HTML
4. **Responsive:** Design mobile-first, enhance for desktop

---

## Accessibility Standards

### WCAG 2.1 AA Compliance

- **Color Contrast:** All text meets 4.5:1 minimum
- **Focus Indicators:** Visible focus states for all interactive elements
- **Keyboard Navigation:** All features keyboard accessible
- **Screen Readers:** Semantic HTML and ARIA attributes
- **Touch Targets:** Minimum 44x44px for mobile

### Implementation

- Use `lib/a11y-colors.ts` for accessible colors
- Use `components/ui/SkipLink.tsx` for skip navigation
- Use `lib/utils/accessibility.ts` for validation

---

## Storybook

### Component Stories

Component stories are located alongside components:
- `components/ui/Button.stories.tsx`
- `components/ui/Modal.stories.tsx`
- `components/ui/FormField.stories.tsx`
- etc.

### Running Storybook

```bash
npm run storybook
```

Stories document:
- Component variants
- Props and usage
- Interactive examples
- Accessibility features

---

## Tailwind Integration

Design tokens are integrated with Tailwind CSS via `tailwind.config.js`.

### Custom Colors

```javascript
colors: {
  primary: tokens.colors.primary,
  success: tokens.colors.success,
  // ... etc
}
```

### Usage in Tailwind

```tsx
<div className="bg-primary-600 text-white p-4 rounded-lg">
  Content
</div>
```

---

## Migration Guide

### Updating Components to Use Design System

1. **Replace hardcoded colors:**
   ```tsx
   // Before
   <div className="bg-blue-600">
   
   // After
   <div className="bg-primary-600">
   ```

2. **Use spacing tokens:**
   ```tsx
   // Before
   <div className="p-4">
   
   // After (if using tokens directly)
   <div style={{ padding: tokens.spacing.md }}>
   ```

3. **Use component library:**
   ```tsx
   // Before
   <button className="px-4 py-2 bg-blue-600">
   
   // After
   <Button variant="primary">Click</Button>
   ```

---

## Resources

- **Design Tokens:** `lib/design-tokens.ts`
- **Accessible Colors:** `lib/a11y-colors.ts`
- **Components:** `components/ui/`
- **Storybook:** Run `npm run storybook`
- **Tailwind Config:** `tailwind.config.js`

---

## Best Practices

1. **Consistency:** Always use design system tokens and components
2. **Accessibility:** Test with screen readers and keyboard navigation
3. **Responsive:** Test on multiple screen sizes
4. **Performance:** Use virtual scrolling for large lists
5. **Documentation:** Update Storybook when adding new components

---

**Document Owner:** Frontend Team  
**Last Updated:** January 2026
