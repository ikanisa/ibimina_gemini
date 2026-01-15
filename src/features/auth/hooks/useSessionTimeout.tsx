/**
 * Session Timeout Hook
 * Automatically logs out users after inactivity period
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AuditLogger } from '@/lib/services/AuditLogger';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Idle timeout: 30 minutes of inactivity
const DEFAULT_IDLE_TIMEOUT_MINUTES = 30;
// Absolute timeout: 8 hours from login (regardless of activity)
const DEFAULT_ABSOLUTE_TIMEOUT_HOURS = 8;
const WARNING_BEFORE_MINUTES = 2;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

// ============================================================================
// TYPES
// ============================================================================

interface UseSessionTimeoutOptions {
    idleTimeoutMinutes?: number; // Idle timeout (default: 30 minutes)
    absoluteTimeoutHours?: number; // Absolute timeout from login (default: 8 hours)
    warningMinutes?: number;
    onTimeout?: () => void;
    onWarning?: (remainingSeconds: number) => void;
    enabled?: boolean;
}

interface SessionTimeoutState {
    isWarning: boolean;
    remainingSeconds: number;
    isActive: boolean;
    timeoutType?: 'idle' | 'absolute'; // Type of timeout that triggered warning
}

// ============================================================================
// HOOK
// ============================================================================

export function useSessionTimeout(options: UseSessionTimeoutOptions = {}) {
    const {
        idleTimeoutMinutes = DEFAULT_IDLE_TIMEOUT_MINUTES,
        absoluteTimeoutHours = DEFAULT_ABSOLUTE_TIMEOUT_HOURS,
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

    const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const absoluteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(Date.now());
    const sessionStartRef = useRef<number>(Date.now());

    const idleTimeoutMs = idleTimeoutMinutes * 60 * 1000;
    const absoluteTimeoutMs = absoluteTimeoutHours * 60 * 60 * 1000;
    const warningMs = warningMinutes * 60 * 1000;

    /**
     * Clear all timers
     */
    const clearTimers = useCallback(() => {
        if (idleTimeoutRef.current) {
            clearTimeout(idleTimeoutRef.current);
            idleTimeoutRef.current = null;
        }
        if (absoluteTimeoutRef.current) {
            clearTimeout(absoluteTimeoutRef.current);
            absoluteTimeoutRef.current = null;
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
    const handleTimeout = useCallback(async (timeoutType: 'idle' | 'absolute' = 'idle') => {
        clearTimers();
        setState((prev) => ({ ...prev, isWarning: false, isActive: false }));

        // Log the timeout event
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await AuditLogger.logAuth(session.user.id, 'auth.session_expired', {
                timeoutType,
                lastActivity: new Date(lastActivityRef.current).toISOString(),
                sessionDuration: Date.now() - sessionStartRef.current,
                idleTimeoutMinutes,
                absoluteTimeoutHours,
            });
        }

        // Sign out
        await supabase.auth.signOut();

        // Call custom handler
        onTimeout?.();

        // Redirect to login
        if (typeof window !== 'undefined') {
            const reason = timeoutType === 'idle' ? 'idle_timeout' : 'session_expired';
            window.location.href = `/login?reason=${reason}`;
        }
    }, [clearTimers, onTimeout, idleTimeoutMinutes, absoluteTimeoutHours]);

    /**
     * Start warning countdown
     */
    const startWarning = useCallback((timeoutType: 'idle' | 'absolute' = 'idle') => {
        let remaining = warningMs / 1000;

        setState((prev) => ({
            ...prev,
            isWarning: true,
            remainingSeconds: remaining,
            timeoutType,
        }));

        onWarning?.(remaining);

        countdownRef.current = setInterval(() => {
            remaining -= 1;
            setState((prev) => ({ ...prev, remainingSeconds: remaining }));
            onWarning?.(remaining);

            if (remaining <= 0) {
                handleTimeout(timeoutType);
            }
        }, 1000);
    }, [warningMs, onWarning, handleTimeout]);

    /**
     * Reset timeout on activity (only resets idle timeout, not absolute)
     */
    const resetTimeout = useCallback(() => {
        if (!enabled) return;

        lastActivityRef.current = Date.now();
        
        // Only clear idle timeout timers, keep absolute timeout
        if (idleTimeoutRef.current) {
            clearTimeout(idleTimeoutRef.current);
            idleTimeoutRef.current = null;
        }
        if (warningRef.current) {
            clearTimeout(warningRef.current);
            warningRef.current = null;
        }
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }

        setState((prev) => ({
            ...prev,
            isWarning: false,
            isActive: true,
            remainingSeconds: 0,
            timeoutType: undefined,
        }));

        // Check which timeout will expire first
        const timeSinceLogin = Date.now() - sessionStartRef.current;
        const timeUntilAbsoluteTimeout = absoluteTimeoutMs - timeSinceLogin;
        const timeUntilIdleTimeout = idleTimeoutMs;

        // Use whichever is shorter
        const nextTimeout = Math.min(timeUntilAbsoluteTimeout, timeUntilIdleTimeout);
        const nextTimeoutType = timeUntilAbsoluteTimeout < timeUntilIdleTimeout ? 'absolute' : 'idle';

        // Set warning timer (only if there's enough time)
        if (nextTimeout > warningMs) {
            warningRef.current = setTimeout(() => {
                startWarning(nextTimeoutType);
            }, nextTimeout - warningMs);
        }

        // Set idle timeout
        idleTimeoutRef.current = setTimeout(() => {
            handleTimeout('idle');
        }, timeUntilIdleTimeout);
    }, [enabled, clearTimers, idleTimeoutMs, absoluteTimeoutMs, warningMs, startWarning, handleTimeout]);

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

        // Get session start time from Supabase session
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.expires_at) {
                // Use session expiry as start time reference
                const sessionAge = (session.expires_at * 1000) - Date.now();
                sessionStartRef.current = Date.now() - (absoluteTimeoutMs - sessionAge);
            } else {
                sessionStartRef.current = Date.now();
            }

            // Set absolute timeout
            const timeSinceLogin = Date.now() - sessionStartRef.current;
            const timeUntilAbsoluteTimeout = absoluteTimeoutMs - timeSinceLogin;

            if (timeUntilAbsoluteTimeout > 0) {
                // Set absolute timeout warning
                if (timeUntilAbsoluteTimeout > warningMs) {
                    warningRef.current = setTimeout(() => {
                        startWarning('absolute');
                    }, timeUntilAbsoluteTimeout - warningMs);
                }

                // Set absolute timeout
                absoluteTimeoutRef.current = setTimeout(() => {
                    handleTimeout('absolute');
                }, timeUntilAbsoluteTimeout);
            } else {
                // Already expired
                handleTimeout('absolute');
            }

            // Initial idle timeout setup
            resetTimeout();
        };

        initSession();

        // Cleanup
        return () => {
            ACTIVITY_EVENTS.forEach((event) => {
                document.removeEventListener(event, handleActivity);
            });
            clearTimers();
        };
    }, [enabled, resetTimeout, clearTimers, absoluteTimeoutMs, warningMs, startWarning, handleTimeout]);

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

interface SessionWarningModalProps {
    isOpen: boolean;
    remainingSeconds: number;
    timeoutType?: 'idle' | 'absolute';
    onExtend: () => void;
    onLogout: () => void;
}

export const SessionWarningModal: React.FC<SessionWarningModalProps> = ({
    isOpen,
    remainingSeconds,
    timeoutType = 'idle',
    onExtend,
    onLogout,
}) => {
    if (!isOpen) return null;

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const timeString = minutes > 0
        ? `${minutes}:${seconds.toString().padStart(2, '0')}`
        : `${seconds} seconds`;

    const message = timeoutType === 'absolute'
        ? `Your session will expire in <strong>${timeString}</strong> due to maximum session duration (8 hours).`
        : `Your session will expire in <strong>${timeString}</strong> due to inactivity.`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
                <h2 className="text-lg font-semibold text-slate-900 mb-2">
                    Session Expiring
                </h2>
                <p 
                    className="text-slate-600 mb-4"
                    dangerouslySetInnerHTML={{ __html: message }}
                />
                <div className="flex gap-3">
                    {timeoutType === 'idle' && (
                        <button
                            onClick={onExtend}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Stay Logged In
                        </button>
                    )}
                    {timeoutType === 'absolute' && (
                        <p className="text-sm text-slate-500 mb-2">
                            Please save your work and log in again.
                        </p>
                    )}
                    <button
                        onClick={onLogout}
                        className={timeoutType === 'idle' 
                            ? "px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                            : "flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        }
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default useSessionTimeout;
