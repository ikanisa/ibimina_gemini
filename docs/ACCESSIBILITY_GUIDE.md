# Accessibility Guide

## Overview

This guide documents the accessibility features and compliance status of the IBIMINA GEMINI application.

## WCAG 2.1 AA Compliance

The application aims for **WCAG 2.1 Level AA** compliance, which includes:

- **Perceivable**: Information must be presentable in ways users can perceive
- **Operable**: Interface components must be operable
- **Understandable**: Information and UI operation must be understandable
- **Robust**: Content must be robust enough for assistive technologies

## Implemented Features

### 1. Skip Links

A skip link is provided at the top of each page to allow keyboard users to skip navigation and go directly to main content.

**Location:** `components/ui/SkipLink.tsx`

**Usage:**
```tsx
import { SkipLink } from './components/ui/SkipLink';

<SkipLink targetId="main-content" />
```

### 2. Focus Indicators

All interactive elements have visible focus indicators for keyboard navigation.

**Implementation:**
- Custom focus styles in `index.css`
- Focus-visible pseudo-class for keyboard-only focus
- High-contrast outline (2px solid blue)
- Box shadow for additional visibility

### 3. ARIA Labels

Interactive elements without visible text have ARIA labels:

- Icon-only buttons: `aria-label` attribute
- Form inputs: Associated labels or `aria-labelledby`
- Navigation landmarks: `role` and `aria-label` attributes
- Status messages: `aria-live` regions

### 4. Color Contrast

All text meets WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large text).

**Color utilities:** `lib/a11y-colors.ts`

**Usage:**
```tsx
import { meetsWcagAA } from './lib/a11y-colors';

const isAccessible = meetsWcagAA('#000000', '#ffffff');
```

### 5. Keyboard Navigation

All interactive elements are keyboard accessible:

- Tab order follows logical flow
- Focus trap in modals
- Escape key closes modals
- Enter/Space activates buttons
- Arrow keys navigate lists and menus

### 6. Screen Reader Support

- Semantic HTML elements (`<main>`, `<nav>`, `<header>`, `<footer>`)
- ARIA landmarks and roles
- Descriptive alt text for images
- Form labels associated with inputs
- Status announcements via `aria-live`

### 7. Touch Targets

All interactive elements meet the minimum 44x44px touch target size (WCAG 2.5.8).

**Validation:** `lib/utils/accessibility.ts`

## Testing

### Automated Testing

#### 1. Playwright + axe-core

Run comprehensive accessibility tests:

```bash
npm run a11y:test
```

Tests check for:
- WCAG 2.1 AA violations
- Color contrast issues
- Keyboard accessibility
- ARIA attribute correctness

#### 2. Accessibility Audit Script

Run manual audit:

```bash
npm run a11y:audit
```

Generates a detailed report in `test-results/accessibility/audit-report.json`

### Manual Testing

#### Keyboard Navigation

1. **Tab Navigation:**
   - Press `Tab` to move forward through interactive elements
   - Press `Shift+Tab` to move backward
   - Verify focus indicators are visible
   - Verify logical tab order

2. **Skip Link:**
   - Press `Tab` on page load
   - Skip link should appear
   - Press `Enter` to activate
   - Should jump to main content

3. **Modal Navigation:**
   - Open a modal
   - Tab should be trapped inside modal
   - `Escape` should close modal
   - Focus should return to trigger element

#### Screen Reader Testing

Test with:
- **NVDA** (Windows, free)
- **JAWS** (Windows, paid)
- **VoiceOver** (macOS/iOS, built-in)
- **TalkBack** (Android, built-in)

**Test Checklist:**
- [ ] Page title announced
- [ ] Navigation landmarks announced
- [ ] Form labels read correctly
- [ ] Button purposes clear
- [ ] Status messages announced
- [ ] Error messages announced
- [ ] Table headers announced

#### Color Contrast Testing

Use tools:
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **axe DevTools** browser extension
- **WAVE** browser extension

## Common Issues and Fixes

### Issue: Missing ARIA Labels

**Problem:** Icon-only buttons without accessible names

**Fix:**
```tsx
// Bad
<button onClick={handleClick}>
  <Icon />
</button>

// Good
<button onClick={handleClick} aria-label="Close dialog">
  <Icon />
</button>
```

### Issue: Missing Form Labels

**Problem:** Inputs without associated labels

**Fix:**
```tsx
// Bad
<input type="text" placeholder="Enter name" />

// Good
<label htmlFor="name-input">Name</label>
<input id="name-input" type="text" />
```

### Issue: Low Color Contrast

**Problem:** Text color doesn't meet 4.5:1 contrast ratio

**Fix:**
```tsx
// Bad
<div className="text-gray-400">Low contrast text</div>

// Good
<div className="text-slate-600">Accessible text</div>
```

### Issue: Missing Focus Indicators

**Problem:** No visible focus state

**Fix:**
```tsx
// Bad
button:focus {
  outline: none;
}

// Good
button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

## Component Guidelines

### Buttons

- Always provide accessible name (text or `aria-label`)
- Use semantic `<button>` element
- Ensure minimum 44x44px touch target
- Include focus indicator

### Forms

- Associate labels with inputs using `htmlFor` and `id`
- Provide error messages with `aria-describedby`
- Use `aria-required` for required fields
- Use `aria-invalid` for validation errors

### Images

- Always include `alt` attribute
- Use empty `alt=""` for decorative images
- Provide descriptive text for informative images

### Navigation

- Use semantic `<nav>` element
- Provide `aria-label` for navigation regions
- Use `aria-current="page"` for current page link

### Modals

- Use `role="dialog"` or `role="alertdialog"`
- Provide `aria-labelledby` pointing to title
- Trap focus inside modal
- Return focus to trigger on close

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)

## Compliance Status

**Current Status:** WCAG 2.1 AA (Target)

**Last Audit:** [Date of last audit]

**Known Issues:**
- [List any known accessibility issues]

**Next Steps:**
- [List planned improvements]
