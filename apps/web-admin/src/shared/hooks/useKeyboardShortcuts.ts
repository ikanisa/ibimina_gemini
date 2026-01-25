/**
 * useKeyboardShortcuts Hook
 * React hook for managing keyboard shortcuts
 */

import { useEffect, useCallback, useRef } from 'react';
import {
  shortcutRegistry,
  type KeyboardShortcut,
  matchesShortcut,
} from '@/lib/shortcuts/keyboard';

export interface UseKeyboardShortcutsOptions {
  /** Whether shortcuts are enabled */
  enabled?: boolean;
  /** Target element (defaults to document) */
  target?: HTMLElement | null;
}

/**
 * Hook for registering and handling keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
): void {
  const { enabled = true, target } = options;
  const shortcutsRef = useRef<KeyboardShortcut[]>(shortcuts);

  // Update shortcuts ref when they change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  // Register/unregister shortcuts
  useEffect(() => {
    if (!enabled) return;

    // Register all shortcuts
    shortcutsRef.current.forEach((shortcut) => {
      shortcutRegistry.register(shortcut);
    });

    // Cleanup: unregister shortcuts
    return () => {
      shortcutsRef.current.forEach((shortcut) => {
        shortcutRegistry.unregister(shortcut.id);
      });
    };
  }, [enabled]);

  // Handle keyboard events
  useEffect(() => {
    if (!enabled) return;

    const element = target || document;
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if typing in input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape and some shortcuts in inputs
        if (event.key !== 'Escape' && !event.ctrlKey && !event.metaKey) {
          return;
        }
      }

      shortcutRegistry.handle(event);
    };

    element.addEventListener('keydown', handleKeyDown);
    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, target]);
}

/**
 * Hook for a single keyboard shortcut
 */
export function useKeyboardShortcut(
  shortcut: KeyboardShortcut,
  options: UseKeyboardShortcutsOptions = {}
): void {
  useKeyboardShortcuts([shortcut], options);
}

/**
 * Hook for checking if a key combination is pressed
 */
export function useKeyPress(
  key: string,
  callback: (event: KeyboardEvent) => void,
  modifiers: string[] = [],
  options: UseKeyboardShortcutsOptions = {}
): void {
  const { enabled = true, target } = options;

  useEffect(() => {
    if (!enabled) return;

    const element = target || document;
    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut: KeyboardShortcut = {
        id: `keypress-${key}-${Date.now()}`,
        key,
        modifiers: modifiers as any,
        description: '',
        handler: callback,
      };

      if (matchesShortcut(event, shortcut)) {
        event.preventDefault();
        callback(event);
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, target, key, callback]);
}
