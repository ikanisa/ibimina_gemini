/**
 * Theme Toggle Component
 * Button to switch between light and dark themes
 */

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { motion } from 'framer-motion';

export interface ThemeToggleProps {
  /** Show label text */
  showLabel?: boolean;
  /** Size of the toggle */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = false,
  size = 'md',
  className = '',
}) => {
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        ${sizes[size]}
        flex items-center justify-center
        rounded-lg
        bg-neutral-100 dark:bg-neutral-800
        text-neutral-700 dark:text-neutral-300
        hover:bg-neutral-200 dark:hover:bg-neutral-700
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        dark:focus:ring-offset-neutral-800
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 180 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {isDark ? (
          <Sun size={iconSizes[size]} className="text-warning-500" />
        ) : (
          <Moon size={iconSizes[size]} className="text-primary-600" />
        )}
      </motion.div>
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </motion.button>
  );
};

export default ThemeToggle;
