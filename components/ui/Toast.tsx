/**
 * Toast Notification System
 * Provides feedback messages for user actions
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextValue {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

interface ToastProviderProps {
    children: React.ReactNode;
    maxToasts?: number;
    defaultDuration?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
    children,
    maxToasts = 5,
    defaultDuration = 5000,
}) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toastIdRef = useRef(0);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        (toast: Omit<Toast, 'id'>) => {
            const id = `toast-${++toastIdRef.current}`;
            const newToast: Toast = {
                ...toast,
                id,
                duration: toast.duration ?? defaultDuration,
            };

            setToasts((prev) => {
                const updated = [...prev, newToast];
                // Remove oldest if exceeds max
                if (updated.length > maxToasts) {
                    return updated.slice(-maxToasts);
                }
                return updated;
            });

            // Auto-remove after duration
            if (newToast.duration && newToast.duration > 0) {
                setTimeout(() => {
                    removeToast(id);
                }, newToast.duration);
            }
        },
        [maxToasts, defaultDuration, removeToast]
    );

    const success = useCallback(
        (title: string, message?: string) => {
            addToast({ type: 'success', title, message });
        },
        [addToast]
    );

    const error = useCallback(
        (title: string, message?: string) => {
            addToast({ type: 'error', title, message, duration: 8000 }); // Longer for errors
        },
        [addToast]
    );

    const warning = useCallback(
        (title: string, message?: string) => {
            addToast({ type: 'warning', title, message });
        },
        [addToast]
    );

    const info = useCallback(
        (title: string, message?: string) => {
            addToast({ type: 'info', title, message });
        },
        [addToast]
    );

    return (
        <ToastContext.Provider
            value={{ toasts, addToast, removeToast, success, error, warning, info }}
        >
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
};

// ============================================================================
// TOAST CONTAINER
// ============================================================================

interface ToastContainerProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
    if (toasts.length === 0) return null;

    return (
        <div
            className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none"
            aria-live="polite"
        >
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
};

// ============================================================================
// TOAST ITEM
// ============================================================================

interface ToastItemProps {
    toast: Toast;
    onRemove: (id: string) => void;
}

const iconMap: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="text-green-500" size={20} />,
    error: <AlertCircle className="text-red-500" size={20} />,
    warning: <AlertTriangle className="text-amber-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
};

const bgColors: Record<ToastType, string> = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200',
};

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleRemove = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 200);
    }, [toast.id, onRemove]);

    return (
        <div
            className={`
        pointer-events-auto
        flex items-start gap-3
        max-w-sm w-full
        bg-white border rounded-lg shadow-lg
        p-4
        transform transition-all duration-200
        ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
        ${bgColors[toast.type]}
        animate-in slide-in-from-right-5 fade-in
      `}
            role="alert"
        >
            <div className="flex-shrink-0 mt-0.5">{iconMap[toast.type]}</div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{toast.title}</p>
                {toast.message && (
                    <p className="text-sm text-slate-600 mt-1">{toast.message}</p>
                )}
            </div>

            <button
                onClick={handleRemove}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Dismiss"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default ToastProvider;
