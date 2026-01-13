import React from 'react';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ValidationErrorProps {
    message?: string | null;
    id?: string;
}

/**
 * ValidationError
 * Standardized form field error display with animation.
 */
export const ValidationError: React.FC<ValidationErrorProps> = ({
    message,
    id,
}) => {
    return (
        <AnimatePresence mode="wait">
            {message && (
                <motion.div
                    id={id}
                    initial={{ opacity: 0, y: -5, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -5, height: 0 }}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-600 mt-1.5 ml-1 overflow-hidden"
                    role="alert"
                >
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{message}</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
