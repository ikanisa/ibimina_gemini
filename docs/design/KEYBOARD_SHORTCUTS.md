# Keyboard Shortcuts Guide

**Version:** 1.0  
**Last Updated:** January 2026

---

## Overview

The IBIMINA GEMINI application supports keyboard shortcuts for improved productivity and accessibility. This guide documents all available shortcuts and how to use them.

---

## Opening the Command Palette

Press **`Ctrl+K`** (or **`Cmd+K`** on Mac) to open the command palette, a searchable interface for accessing all commands and shortcuts.

---

## Global Shortcuts

### Navigation

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+K` / `Cmd+K` | Open Command Palette | Search and execute commands |
| `Escape` | Close Modal/Dialog | Close any open modal, dialog, or command palette |
| `?` | Show Shortcuts | Display keyboard shortcuts help |

### Actions

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+S` / `Cmd+S` | Save | Save current form or document |
| `Ctrl+N` / `Cmd+N` | New | Create new item (context-dependent) |
| `Ctrl+E` / `Cmd+E` | Edit | Edit current item |
| `Delete` | Delete | Delete selected item (with confirmation) |

### Navigation (in lists/tables)

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Arrow Down` | Next Item | Move to next item in list |
| `Arrow Up` | Previous Item | Move to previous item in list |
| `Home` | First Item | Jump to first item |
| `End` | Last Item | Jump to last item |
| `Enter` | Select | Select/activate current item |

---

## Context-Specific Shortcuts

### Transactions Page

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+F` / `Cmd+F` | Focus Search | Focus the search input |
| `Ctrl+A` / `Cmd+A` | Select All | Select all visible transactions |
| `Ctrl+D` / `Cmd+D` | Deselect All | Deselect all transactions |

### Forms

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Enter` | Submit | Submit form (if valid) |
| `Escape` | Cancel | Cancel and close form |
| `Tab` | Next Field | Move to next form field |
| `Shift+Tab` | Previous Field | Move to previous form field |

### Modals/Dialogs

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Escape` | Close | Close modal/dialog |
| `Enter` | Confirm | Confirm action (if applicable) |

---

## Command Palette

The command palette (`Ctrl+K`) provides quick access to:

- **Navigation:** Jump to any page
- **Actions:** Create, edit, delete items
- **Search:** Search across all data
- **Settings:** Access settings and preferences

### Using the Command Palette

1. Press `Ctrl+K` (or `Cmd+K` on Mac)
2. Type to search for commands
3. Use arrow keys to navigate
4. Press `Enter` to execute
5. Press `Escape` to close

---

## Implementation

### Using Keyboard Shortcuts in Components

```tsx
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcuts';

function MyComponent() {
  useKeyboardShortcut({
    id: 'my-shortcut',
    key: 'k',
    modifiers: ['ctrl'],
    description: 'Do something',
    handler: () => {
      // Handle shortcut
    },
  });

  return <div>Content</div>;
}
```

### Using Multiple Shortcuts

```tsx
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function MyComponent() {
  useKeyboardShortcuts([
    {
      id: 'save',
      key: 's',
      modifiers: ['ctrl'],
      description: 'Save',
      handler: () => save(),
    },
    {
      id: 'new',
      key: 'n',
      modifiers: ['ctrl'],
      description: 'New',
      handler: () => createNew(),
    },
  ]);

  return <div>Content</div>;
}
```

### Using Command Palette

```tsx
import { CommandPalette } from '@/components/ui/CommandPalette';
import { useState } from 'react';

function App() {
  const [isOpen, setIsOpen] = useState(false);

  const commands = [
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      description: 'Navigate to dashboard',
      action: () => navigate('/dashboard'),
    },
    // ... more commands
  ];

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open</button>
      <CommandPalette
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        items={commands}
      />
    </>
  );
}
```

---

## Best Practices

### Do's

✅ Use common shortcuts (Ctrl+S for save, Ctrl+K for search)  
✅ Provide visual feedback when shortcuts are triggered  
✅ Show shortcuts in tooltips and help text  
✅ Support both Ctrl (Windows/Linux) and Cmd (Mac)  
✅ Allow shortcuts to work in inputs when appropriate  

### Don'ts

❌ Don't override browser shortcuts (Ctrl+T, Ctrl+W, etc.)  
❌ Don't use shortcuts that conflict with screen readers  
❌ Don't require shortcuts for essential functionality  
❌ Don't use obscure or non-standard shortcuts  

---

## Accessibility

### Keyboard Navigation

All features are accessible via keyboard:
- Tab navigation through interactive elements
- Arrow keys for list navigation
- Enter/Space for activation
- Escape for closing modals

### Screen Readers

Shortcuts are announced to screen readers:
- ARIA labels on shortcut buttons
- Keyboard shortcut hints in tooltips
- Announcements when shortcuts are triggered

### Customization

Users can:
- View all shortcuts in the help modal (`?`)
- See shortcuts in tooltips
- Use command palette to discover commands

---

## Platform Differences

### Windows/Linux

- Use `Ctrl` modifier
- Example: `Ctrl+K`, `Ctrl+S`

### macOS

- Use `Cmd` (⌘) modifier
- Example: `Cmd+K`, `Cmd+S`
- The system automatically maps `Ctrl` to `Cmd` where appropriate

---

## Resources

- **Shortcut Utilities:** `lib/shortcuts/keyboard.ts`
- **Shortcut Hook:** `hooks/useKeyboardShortcuts.ts`
- **Command Palette:** `components/ui/CommandPalette.tsx`
- **Shortcut Help:** `components/ui/ShortcutHelp.tsx`

---

**Document Owner:** Frontend Team  
**Last Updated:** January 2026
