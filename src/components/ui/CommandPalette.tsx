/**
 * Command Palette Component
 * Searchable command palette with keyboard shortcuts
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Command } from 'lucide-react';
import { useKeyboardShortcut } from '@/shared/hooks/useKeyboardShortcuts';
import { formatShortcut, type KeyboardShortcut } from '@/lib/shortcuts/keyboard';
import { shortcutRegistry } from '@/lib/shortcuts/keyboard';

export interface CommandPaletteItem {
  id: string;
  label: string;
  description?: string;
  shortcut?: KeyboardShortcut;
  category?: string;
  icon?: React.ReactNode;
  action: () => void;
}

export interface CommandPaletteProps {
  /** Whether the palette is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Command items */
  items: CommandPaletteItem[];
  /** Placeholder text */
  placeholder?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  items,
  placeholder = 'Type a command or search...',
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;

    const query = search.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
    );
  }, [items, search]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearch('');
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  // Close on Escape
  useKeyboardShortcut(
    {
      id: 'command-palette-close',
      key: 'Escape',
      description: 'Close command palette',
      handler: () => onClose(),
    },
    { enabled: isOpen }
  );

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, CommandPaletteItem[]> = {};
    filteredItems.forEach((item) => {
      const category = item.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });
    return groups;
  }, [filteredItems]);

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

          {/* Palette */}
          <div className="fixed inset-0 flex items-start justify-center pt-[20vh] z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="
                w-full max-w-2xl mx-4
                bg-white dark:bg-neutral-800
                rounded-lg shadow-2xl
                border border-neutral-200 dark:border-neutral-700
                pointer-events-auto
                overflow-hidden
              "
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                <Search className="w-5 h-5 text-neutral-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={placeholder}
                  className="
                    flex-1 bg-transparent
                    text-neutral-900 dark:text-neutral-100
                    placeholder:text-neutral-400 dark:placeholder:text-neutral-500
                    outline-none
                  "
                />
                <kbd className="
                  px-2 py-1
                  text-xs font-mono
                  bg-neutral-100 dark:bg-neutral-700
                  text-neutral-600 dark:text-neutral-300
                  rounded border border-neutral-200 dark:border-neutral-600
                ">
                  Esc
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <div className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
                    No commands found
                  </div>
                ) : (
                  Object.entries(groupedItems).map(([category, categoryItems]) => (
                    <div key={category}>
                      {category !== 'Other' && (
                        <div className="px-4 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                          {category}
                        </div>
                      )}
                      {categoryItems.map((item, index) => {
                        const globalIndex = filteredItems.indexOf(item);
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              item.action();
                              onClose();
                            }}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`
                              w-full flex items-center gap-3 px-4 py-3
                              text-left
                              transition-colors
                              ${isSelected
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100'
                                : 'text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
                              }
                            `}
                          >
                            {item.icon && (
                              <div className="flex-shrink-0">{item.icon}</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{item.label}</div>
                              {item.description && (
                                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                  {item.description}
                                </div>
                              )}
                            </div>
                            {item.shortcut && (
                              <kbd className="
                                px-2 py-1
                                text-xs font-mono
                                bg-neutral-100 dark:bg-neutral-700
                                text-neutral-600 dark:text-neutral-300
                                rounded border border-neutral-200 dark:border-neutral-600
                              ">
                                {formatShortcut(item.shortcut)}
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
