/**
 * Session Timeout Hook
 * Automatically logs out users after inactivity period
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuditLogger } from '../lib/services/AuditLogger';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_TIMEOUT_MINUTES = 30;
const WARNING_BEFORE_MINUTES = 2;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

// ============================================================================
// TYPES
// ============================================================================

interface UseSessionTimeoutOptions {
    timeoutMinutes?: number;
    warningMinutes?: number;
    onTimeout?: () => void;
    onWarning?: (remainingSeconds: number) => void;
    enabled?: boolean;
}

interface SessionTimeoutState {
    isWarning: boolean;
    remainingSeconds: number;
    isActive: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export function useSessionTimeout(options: UseSessionTimeoutOptions = {}) {
    const {
        timeoutMinutes = DEFAULT_TIMEOUT_MINUTES,
        warningMinutes = WARNING_BEFORE_MINUTES,
        onTimeout,
        onWarning,
        enabled = true,
    } = options;

    const [state, setState] = useState<SessionTimeoutState>({
        isWarning: false,
        remainingSeconds: 0,
        isActive: true,
    });

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(Date.now());

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = warningMinutes * 60 * 1000;

    /**
     * Clear all timers
     */
    const clearTimers = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (warningRef.current) {
            clearTimeout(warningRef.current);
            warningRef.current = null;
        }
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
    }, []);

    /**
     * Handle session timeout
     */
    const handleTimeout = useCallback(async () => {
        clearTimers();
        setState((prev) => ({ ...prev, isWarning: false, isActive: false }));

        // Log the timeout event
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await AuditLogger.logAuth(session.user.id, 'auth.session_expired', {
                lastActivity: new Date(lastActivityRef.current).toISOString(),
                timeoutMinutes,
            });
        }

        // Sign out
        await supabase.auth.signOut();

        // Call custom handler
        onTimeout?.();

        // Redirect to login
        if (typeof window !== 'undefined') {
            window.location.href = '/login?reason=timeout';
        }
    }, [clearTimers, onTimeout, timeoutMinutes]);

    /**
     * Start warning countdown
     */
    const startWarning = useCallback(() => {
        let remaining = warningMs / 1000;

        setState((prev) => ({
            ...prev,
            isWarning: true,
            remainingSeconds: remaining,
        }));

        onWarning?.(remaining);

        countdownRef.current = setInterval(() => {
            remaining -= 1;
            setState((prev) => ({ ...prev, remainingSeconds: remaining }));
            onWarning?.(remaining);

            if (remaining <= 0) {
                handleTimeout();
            }
        }, 1000);
    }, [warningMs, onWarning, handleTimeout]);

    /**
     * Reset timeout on activity
     */
    const resetTimeout = useCallback(() => {
        if (!enabled) return;

        lastActivityRef.current = Date.now();
        clearTimers();

        setState((prev) => ({
            ...prev,
            isWarning: false,
            isActive: true,
            remainingSeconds: 0,
        }));

        // Set warning timer
        warningRef.current = setTimeout(() => {
            startWarning();
        }, timeoutMs - warningMs);

        // Set final timeout
        timeoutRef.current = setTimeout(() => {
            handleTimeout();
        }, timeoutMs);
    }, [enabled, clearTimers, timeoutMs, warningMs, startWarning, handleTimeout]);

    /**
     * Extend session (dismiss warning)
     */
    const extendSession = useCallback(() => {
        resetTimeout();
    }, [resetTimeout]);

    /**
     * Force logout
     */
    const logout = useCallback(async () => {
        clearTimers();
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }, [clearTimers]);

    /**
     * Setup activity listeners
     */
    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        // Throttle activity detection
        let lastThrottle = 0;
        const throttleMs = 5000; // Only track activity every 5 seconds

        const handleActivity = () => {
            const now = Date.now();
            if (now - lastThrottle > throttleMs) {
                lastThrottle = now;
                resetTimeout();
            }
        };

        // Add listeners
        ACTIVITY_EVENTS.forEach((event) => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        // Initial timeout setup
        resetTimeout();

        // Cleanup
        return () => {
            ACTIVITY_EVENTS.forEach((event) => {
                document.removeEventListener(event, handleActivity);
            });
            clearTimers();
        };
    }, [enabled, resetTimeout, clearTimers]);

    return {
        ...state,
        extendSession,
        logout,
        resetTimeout,
    };
}

// ============================================================================
// WARNING MODAL COMPONENT
// ============================================================================

interface SessionWarningModalProps {
    isOpen: boolean;
    remainingSeconds: number;
    onExtend: () => void;
    onLogout: () => void;
}

export const SessionWarningModal: React.FC<SessionWarningModalProps> = ({
    isOpen,
    remainingSeconds,
    onExtend,
    onLogout,
}) => {
    if (!isOpen) return null;

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const timeString = minutes > 0
        ? `${minutes}:${seconds.toString().padStart(2, '0')}`
        : `${seconds} seconds`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
                <h2 className="text-lg font-semibold text-slate-900 mb-2">
                    Session Expiring
                </h2>
                <p className="text-slate-600 mb-4">
                    Your session will expire in <strong>{timeString}</strong> due to inactivity.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onExtend}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Stay Logged In
                    </button>
                    <button
                        onClick={onLogout}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default useSessionTimeout;
