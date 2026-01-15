/**
 * Reusable Loading Spinner Component
 */

import React from 'react';
import { motion } from 'framer-motion';
import { loadingSpin } from '../../lib/animations/framer-motion';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  text
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <motion.div
        className={`rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}
        role="status"
        aria-label="Loading"
        variants={loadingSpin}
        animate="animate"
      />
      {text && (
        <motion.p 
          className="text-sm text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

