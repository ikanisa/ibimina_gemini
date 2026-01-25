/**
 * Refresh Token Rotation Hook
 * Implements automatic token refresh with rotation
 * Works with Supabase's built-in refresh token handling
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const REFRESH_MARGIN_SECONDS = 60; // Refresh 1 minute before expiry
const TOKEN_CHECK_INTERVAL_MS = 30000; // Check every 30 seconds
const MAX_REFRESH_RETRIES = 3;

// ============================================================================
// HOOK
// ============================================================================

interface UseTokenRotationOptions {
    onTokenRefreshed?: (session: Session) => void;
    onRefreshError?: (error: Error) => void;
    enabled?: boolean;
}

/**
 * Hook that implements refresh token rotation
 * Supabase handles the actual rotation, this ensures proactive refresh
 */
export function useTokenRotation(options: UseTokenRotationOptions = {}) {
    const {
        onTokenRefreshed,
        onRefreshError,
        enabled = true
    } = options;

    const retryCountRef = useRef(0);
    const refreshingRef = useRef(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /**
     * Check if token needs refresh
     */
    const shouldRefreshToken = useCallback((session: Session | null): boolean => {
        if (!session?.expires_at) return false;

        const expiresAt = session.expires_at * 1000; // Convert to ms
        const now = Date.now();
        const refreshThreshold = REFRESH_MARGIN_SECONDS * 1000;

        return expiresAt - now < refreshThreshold;
    }, []);

    /**
     * Refresh the session
     */
    const refreshSession = useCallback(async () => {
        if (refreshingRef.current) return;

        refreshingRef.current = true;

        try {
            const { data, error } = await supabase.auth.refreshSession();

            if (error) {
                throw error;
            }

            if (data.session) {
                retryCountRef.current = 0;
                onTokenRefreshed?.(data.session);

                // Log for debugging (remove in production)
                if (import.meta.env.DEV) {
                    console.log('[TokenRotation] Session refreshed', {
                        expires_at: new Date(data.session.expires_at! * 1000).toISOString(),
                    });
                }
            }
        } catch (error) {
            retryCountRef.current++;

            if (retryCountRef.current >= MAX_REFRESH_RETRIES) {
                console.error('[TokenRotation] Max retries exceeded');
                onRefreshError?.(error as Error);
            } else {
                // Retry with exponential backoff
                const delay = Math.pow(2, retryCountRef.current) * 1000;
                setTimeout(refreshSession, delay);
            }
        } finally {
            refreshingRef.current = false;
        }
    }, [onTokenRefreshed, onRefreshError]);

    /**
     * Check token and refresh if needed
     */
    const checkAndRefresh = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (session && shouldRefreshToken(session)) {
            await refreshSession();
        }
    }, [shouldRefreshToken, refreshSession]);

    /**
     * Set up periodic check and auth state listener
     */
    useEffect(() => {
        if (!enabled) return;

        // Initial check
        checkAndRefresh();

        // Periodic check
        intervalRef.current = setInterval(checkAndRefresh, TOKEN_CHECK_INTERVAL_MS);

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === 'TOKEN_REFRESHED' && session) {
                    onTokenRefreshed?.(session);
                }

                if (event === 'SIGNED_OUT') {
                    retryCountRef.current = 0;
                }
            }
        );

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            subscription.unsubscribe();
        };
    }, [enabled, checkAndRefresh, onTokenRefreshed]);

    /**
     * Manual refresh function
     */
    const forceRefresh = useCallback(async () => {
        await refreshSession();
    }, [refreshSession]);

    return {
        forceRefresh,
        isRefreshing: refreshingRef.current,
    };
}

// ============================================================================
// SUPABASE SESSION MANAGEMENT CONFIG
// Supabase automatically handles refresh token rotation with these settings
// ============================================================================

/**
 * Recommended Supabase client configuration for token rotation
 * 
 * createClient(url, key, {
 *   auth: {
 *     autoRefreshToken: true,      // Automatically refresh before expiry
 *     persistSession: true,        // Store in localStorage
 *     detectSessionInUrl: true,    // Handle OAuth callbacks
 *     storage: window.localStorage,
 *     storageKey: 'sb-auth-token',
 *     flowType: 'pkce',            // Secure code exchange
 *   },
 * })
 */

// ============================================================================
// TOKEN VALIDATION
// ============================================================================

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
    try {
        const [, payload] = token.split('.');
        const decoded = JSON.parse(atob(payload));
        const exp = decoded.exp * 1000;
        return Date.now() >= exp;
    } catch {
        return true;
    }
}

/**
 * Get token expiration time
 */
export function getTokenExpiry(token: string): Date | null {
    try {
        const [, payload] = token.split('.');
        const decoded = JSON.parse(atob(payload));
        return new Date(decoded.exp * 1000);
    } catch {
        return null;
    }
}

export default useTokenRotation;
