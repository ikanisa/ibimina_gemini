/**
 * Shortcut Help Modal
 * Displays all available keyboard shortcuts
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { shortcutRegistry, formatShortcut, type KeyboardShortcut } from '../../lib/shortcuts/keyboard';

export interface ShortcutHelpProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
}

export const ShortcutHelp: React.FC<ShortcutHelpProps> = ({ isOpen, onClose }) => {
  const shortcuts = useMemo(() => shortcutRegistry.getAll(), [isOpen]);

  // Group shortcuts by category
  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, KeyboardShortcut[]> = {};
    shortcuts.forEach((shortcut) => {
      const category = shortcut.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(shortcut);
    });
    return groups;
  }, [shortcuts]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="
                w-full max-w-3xl max-h-[80vh] mx-4
                bg-white dark:bg-neutral-800
                rounded-lg shadow-2xl
                border border-neutral-200 dark:border-neutral-700
                pointer-events-auto
                overflow-hidden
                flex flex-col
              "
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-3">
                  <Keyboard className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    Keyboard Shortcuts
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="
                    p-2 rounded-lg
                    text-neutral-500 dark:text-neutral-400
                    hover:bg-neutral-100 dark:hover:bg-neutral-700
                    transition-colors
                  "
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {shortcuts.length === 0 ? (
                  <div className="text-center text-neutral-500 dark:text-neutral-400 py-8">
                    No keyboard shortcuts available
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                      <div key={category}>
                        <h3 className="
                          text-sm font-semibold
                          text-neutral-700 dark:text-neutral-300
                          uppercase tracking-wide
                          mb-3
                        ">
                          {category}
                        </h3>
                        <div className="space-y-2">
                          {categoryShortcuts.map((shortcut) => (
                            <div
                              key={shortcut.id}
                              className="
                                flex items-center justify-between
                                px-4 py-3
                                bg-neutral-50 dark:bg-neutral-900/50
                                rounded-lg
                              "
                            >
                              <div className="flex-1">
                                <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {shortcut.description}
                                </div>
                              </div>
                              <kbd className="
                                px-3 py-1.5
                                text-sm font-mono
                                bg-white dark:bg-neutral-800
                                text-neutral-700 dark:text-neutral-300
                                rounded border border-neutral-200 dark:border-neutral-700
                                shadow-sm
                              ">
                                {formatShortcut(shortcut)}
                              </kbd>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                  Press <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded text-xs">Esc</kbd> to close
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShortcutHelp;
