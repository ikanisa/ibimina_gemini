/**
 * Keyboard Shortcut Utilities
 * Centralized keyboard shortcut management
 */

export type KeyboardModifier = 'ctrl' | 'alt' | 'shift' | 'meta';
export type KeyboardKey = string;

export interface KeyboardShortcut {
  /** Unique identifier for the shortcut */
  id: string;
  /** Keyboard key (e.g., 'k', 'Enter', 'Escape') */
  key: KeyboardKey;
  /** Modifier keys */
  modifiers?: KeyboardModifier[];
  /** Description of what the shortcut does */
  description: string;
  /** Category for grouping shortcuts */
  category?: string;
  /** Handler function */
  handler: (event: KeyboardEvent) => void;
  /** Whether the shortcut is enabled */
  enabled?: boolean;
  /** Prevent default behavior */
  preventDefault?: boolean;
}

/**
 * Parse keyboard event to match shortcut
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut
): boolean {
  // Check key
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false;
  }

  // Check modifiers
  const requiredModifiers = shortcut.modifiers || [];
  const hasCtrl = requiredModifiers.includes('ctrl') && (event.ctrlKey || event.metaKey);
  const hasAlt = requiredModifiers.includes('alt') && event.altKey;
  const hasShift = requiredModifiers.includes('shift') && event.shiftKey;
  const hasMeta = requiredModifiers.includes('meta') && event.metaKey;

  // Ensure no extra modifiers are pressed
  const hasExtraModifiers =
    (!requiredModifiers.includes('ctrl') && (event.ctrlKey || event.metaKey)) ||
    (!requiredModifiers.includes('alt') && event.altKey) ||
    (!requiredModifiers.includes('shift') && event.shiftKey) ||
    (!requiredModifiers.includes('meta') && event.metaKey && !event.ctrlKey);

  if (hasExtraModifiers) {
    return false;
  }

  // Check all required modifiers are present
  if (requiredModifiers.includes('ctrl') && !hasCtrl) return false;
  if (requiredModifiers.includes('alt') && !hasAlt) return false;
  if (requiredModifiers.includes('shift') && !hasShift) return false;
  if (requiredModifiers.includes('meta') && !hasMeta) return false;

  return true;
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.modifiers) {
    if (shortcut.modifiers.includes('ctrl')) {
      parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
    }
    if (shortcut.modifiers.includes('alt')) {
      parts.push('Alt');
    }
    if (shortcut.modifiers.includes('shift')) {
      parts.push('Shift');
    }
    if (shortcut.modifiers.includes('meta')) {
      parts.push('⌘');
    }
  }

  // Format key
  let key = shortcut.key;
  if (key === ' ') key = 'Space';
  if (key.length === 1) key = key.toUpperCase();

  parts.push(key);

  return parts.join(' + ');
}

/**
 * Keyboard shortcut registry
 */
class ShortcutRegistry {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: KeyboardShortcut): void {
    this.shortcuts.set(shortcut.id, shortcut);
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(id: string): void {
    this.shortcuts.delete(id);
  }

  /**
   * Get all shortcuts
   */
  getAll(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get shortcuts by category
   */
  getByCategory(category: string): KeyboardShortcut[] {
    return this.getAll().filter((s) => s.category === category);
  }

  /**
   * Find shortcut matching keyboard event
   */
  findMatch(event: KeyboardEvent): KeyboardShortcut | undefined {
    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.enabled !== false && matchesShortcut(event, shortcut)) {
        return shortcut;
      }
    }
    return undefined;
  }

  /**
   * Handle keyboard event
   */
  handle(event: KeyboardEvent): boolean {
    const shortcut = this.findMatch(event);
    if (shortcut) {
      if (shortcut.preventDefault !== false) {
        event.preventDefault();
      }
      shortcut.handler(event);
      return true;
    }
    return false;
  }
}

// Global registry instance
export const shortcutRegistry = new ShortcutRegistry();

/**
 * Common keyboard shortcuts
 */
export const COMMON_SHORTCUTS = {
  // Navigation
  SEARCH: 'ctrl+k',
  ESCAPE: 'Escape',
  
  // Actions
  SAVE: 'ctrl+s',
  NEW: 'ctrl+n',
  DELETE: 'Delete',
  EDIT: 'ctrl+e',
  
  // Navigation
  NEXT: 'ArrowDown',
  PREVIOUS: 'ArrowUp',
  FIRST: 'Home',
  LAST: 'End',
  
  // Modals/Dialogs
  CLOSE: 'Escape',
  CONFIRM: 'Enter',
} as const;

/**
 * Parse shortcut string (e.g., "ctrl+k", "shift+Enter")
 */
export function parseShortcutString(shortcut: string): {
  key: string;
  modifiers: KeyboardModifier[];
} {
  const parts = shortcut.toLowerCase().split('+').map((s) => s.trim());
  const modifiers: KeyboardModifier[] = [];
  let key = '';

  for (const part of parts) {
    switch (part) {
      case 'ctrl':
      case 'control':
        modifiers.push('ctrl');
        break;
      case 'alt':
        modifiers.push('alt');
        break;
      case 'shift':
        modifiers.push('shift');
        break;
      case 'meta':
      case 'cmd':
        modifiers.push('meta');
        break;
      default:
        key = part;
    }
  }

  return { key, modifiers };
}
