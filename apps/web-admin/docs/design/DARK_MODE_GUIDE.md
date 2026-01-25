# Dark Mode Implementation Guide

**Version:** 1.0  
**Last Updated:** January 2026

---

## Overview

The IBIMINA GEMINI application supports dark mode with automatic system preference detection and manual theme switching.

---

## Theme System

### Theme Options

- **Light:** Default light theme
- **Dark:** Dark theme with adjusted colors
- **System:** Follows system preference (light/dark)

### Implementation

The theme system is implemented using:
- Tailwind CSS `dark:` variant
- Class-based dark mode (`darkMode: 'class'` in `tailwind.config.js`)
- localStorage persistence
- System preference detection

---

## Usage

### Using the Theme Hook

```tsx
import { useTheme } from '@/hooks/useTheme';

function MyComponent() {
  const { theme, effectiveTheme, setTheme, toggleTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Effective theme: {effectiveTheme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  );
}
```

### Using ThemeToggle Component

```tsx
import { ThemeToggle } from '@/components/ui/ThemeToggle';

<ThemeToggle showLabel={true} size="md" />
```

---

## Styling with Dark Mode

### Tailwind Dark Mode Classes

Use the `dark:` prefix for dark mode styles:

```tsx
<div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
  Content
</div>
```

### Color Usage

**Backgrounds:**
- Light: `bg-white`, `bg-neutral-50`, `bg-neutral-100`
- Dark: `dark:bg-neutral-900`, `dark:bg-neutral-800`, `dark:bg-neutral-700`

**Text:**
- Light: `text-neutral-900`, `text-neutral-700`, `text-neutral-500`
- Dark: `dark:text-neutral-100`, `dark:text-neutral-300`, `dark:text-neutral-400`

**Borders:**
- Light: `border-neutral-200`, `border-neutral-300`
- Dark: `dark:border-neutral-700`, `dark:border-neutral-600`

### Design Token Colors

All design token colors work in both themes:

```tsx
// Primary colors adapt automatically
<button className="bg-primary-600 dark:bg-primary-500 text-white">
  Button
</button>

// Semantic colors
<div className="bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300">
  Success message
</div>
```

---

## Component Patterns

### Cards

```tsx
<div className="
  bg-white dark:bg-neutral-800
  border border-neutral-200 dark:border-neutral-700
  text-neutral-900 dark:text-neutral-100
  rounded-lg p-6
">
  Card content
</div>
```

### Buttons

```tsx
<button className="
  bg-primary-600 dark:bg-primary-500
  hover:bg-primary-700 dark:hover:bg-primary-600
  text-white
  rounded-lg px-4 py-2
">
  Button
</button>
```

### Inputs

```tsx
<input className="
  bg-white dark:bg-neutral-800
  border border-neutral-300 dark:border-neutral-600
  text-neutral-900 dark:text-neutral-100
  placeholder:text-neutral-500 dark:placeholder:text-neutral-400
  rounded-lg px-4 py-2
" />
```

### Tables

```tsx
<table className="
  bg-white dark:bg-neutral-800
  text-neutral-900 dark:text-neutral-100
">
  <thead className="bg-neutral-50 dark:bg-neutral-900">
    <tr>
      <th className="border-b border-neutral-200 dark:border-neutral-700">
        Header
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-neutral-100 dark:border-neutral-800">
      <td>Cell</td>
    </tr>
  </tbody>
</table>
```

---

## Best Practices

### Do's

✅ Always provide dark mode styles for backgrounds and text  
✅ Use design token colors that work in both themes  
✅ Test components in both light and dark modes  
✅ Ensure sufficient contrast in dark mode (WCAG AA)  
✅ Use semantic color names (primary, success, etc.)  

### Don'ts

❌ Don't use hardcoded colors without dark variants  
❌ Don't assume white/black backgrounds  
❌ Don't forget to style borders and dividers  
❌ Don't ignore system preference  
❌ Don't use low contrast colors in dark mode  

---

## Accessibility

### Color Contrast

All colors meet WCAG 2.1 AA contrast requirements in both themes:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum

### Focus Indicators

Focus indicators are visible in both themes:

```css
:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

### Reduced Motion

Animations respect `prefers-reduced-motion` in both themes.

---

## Testing

### Manual Testing

1. Toggle theme using ThemeToggle component
2. Check all pages in both themes
3. Verify system preference detection
4. Test theme persistence (refresh page)
5. Check color contrast

### Automated Testing

```tsx
// E2E test example
test('theme toggle works', async ({ page }) => {
  await page.goto('/');
  await page.click('[aria-label*="theme"]');
  await expect(page.locator('html')).toHaveClass(/dark/);
});
```

---

## Migration Guide

### Updating Existing Components

1. **Add dark mode classes:**
   ```tsx
   // Before
   <div className="bg-white text-neutral-900">
   
   // After
   <div className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
   ```

2. **Update borders:**
   ```tsx
   // Before
   <div className="border border-neutral-200">
   
   // After
   <div className="border border-neutral-200 dark:border-neutral-700">
   ```

3. **Update shadows:**
   ```tsx
   // Before
   <div className="shadow-md">
   
   // After (shadows work in both themes)
   <div className="shadow-md dark:shadow-lg">
   ```

---

## Resources

- **Theme Utilities:** `lib/theme/dark-mode.ts`
- **Theme Hook:** `hooks/useTheme.ts`
- **Theme Toggle:** `components/ui/ThemeToggle.tsx`
- **Tailwind Config:** `tailwind.config.js`
- **Design Tokens:** `lib/design-tokens.ts`

---

**Document Owner:** Frontend Team  
**Last Updated:** January 2026
