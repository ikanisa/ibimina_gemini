/**
 * Confirmation Dialog Component
 * Modal for confirming critical actions
 */

import React, { useEffect, useRef } from 'react';
import { X, AlertTriangle, CheckCircle, AlertCircle, HelpCircle, LucideIcon } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type DialogVariant = 'danger' | 'warning' | 'success' | 'info';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: DialogVariant;
    loading?: boolean;
}

// ============================================================================
// STYLES
// ============================================================================

const variantConfig: Record<DialogVariant, { icon: LucideIcon; iconColor: string; buttonColor: string }> = {
    danger: {
        icon: AlertTriangle,
        iconColor: 'text-red-600 bg-red-100',
        buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    },
    warning: {
        icon: AlertCircle,
        iconColor: 'text-amber-600 bg-amber-100',
        buttonColor: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    },
    success: {
        icon: CheckCircle,
        iconColor: 'text-green-600 bg-green-100',
        buttonColor: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    },
    info: {
        icon: HelpCircle,
        iconColor: 'text-blue-600 bg-blue-100',
        buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'info',
    loading = false,
}) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);

    const config = variantConfig[variant];
    const Icon = config.icon;

    // Focus management
    useEffect(() => {
        if (isOpen && cancelRef.current) {
            cancelRef.current.focus();
        }
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !loading) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, loading, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={loading ? undefined : onClose}
                aria-hidden="true"
            />

            {/* Dialog */}
            <div
                ref={dialogRef}
                className="relative bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all animate-in zoom-in-95 fade-in duration-200"
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                    aria-label="Close dialog"
                >
                    <X size={20} />
                </button>

                <div className="p-6">
                    {/* Icon */}
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${config.iconColor}`}>
                        <Icon size={24} />
                    </div>

                    {/* Title */}
                    <h2
                        id="dialog-title"
                        className="text-lg font-semibold text-slate-900 mb-2"
                    >
                        {title}
                    </h2>

                    {/* Message */}
                    <div className="text-sm text-slate-600 mb-6">
                        {message}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            ref={cancelRef}
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.buttonColor}`}
                        >
                            {loading ? (
                                <span className="inline-flex items-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    Processing...
                                </span>
                            ) : (
                                confirmText
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// HOOK FOR EASIER USAGE
// ============================================================================

interface UseConfirmDialogOptions {
    title: string;
    message: string;
    confirmText?: string;
    variant?: DialogVariant;
}

export function useConfirmDialog() {
    const [state, setState] = React.useState<{
        isOpen: boolean;
        options: UseConfirmDialogOptions | null;
        resolve: ((value: boolean) => void) | null;
    }>({
        isOpen: false,
        options: null,
        resolve: null,
    });

    const confirm = React.useCallback((options: UseConfirmDialogOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({
                isOpen: true,
                options,
                resolve,
            });
        });
    }, []);

    const handleClose = React.useCallback(() => {
        state.resolve?.(false);
        setState({ isOpen: false, options: null, resolve: null });
    }, [state.resolve]);

    const handleConfirm = React.useCallback(() => {
        state.resolve?.(true);
        setState({ isOpen: false, options: null, resolve: null });
    }, [state.resolve]);

    const DialogComponent = state.options ? (
        <ConfirmDialog
            isOpen={state.isOpen}
            onClose={handleClose}
            onConfirm={handleConfirm}
            title={state.options.title}
            message={state.options.message}
            confirmText={state.options.confirmText}
            variant={state.options.variant}
        />
    ) : null;

    return { confirm, DialogComponent };
}

export default ConfirmDialog;
