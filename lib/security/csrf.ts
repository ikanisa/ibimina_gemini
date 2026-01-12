/**
 * CSRF Protection Utilities
 * Client-side CSRF token management for form submissions
 */

// ============================================================================
// CSRF TOKEN GENERATION
// ============================================================================

/**
 * Generate a cryptographically secure random token
 */
function generateToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// CSRF TOKEN STORAGE
// ============================================================================

const CSRF_TOKEN_KEY = '_csrf_token';
const CSRF_TOKEN_EXPIRY_KEY = '_csrf_token_expiry';
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get or create a CSRF token
 */
export function getCsrfToken(): string {
    try {
        const existingToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
        const expiry = sessionStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);

        // Check if token exists and is not expired
        if (existingToken && expiry) {
            const expiryTime = parseInt(expiry, 10);
            if (Date.now() < expiryTime) {
                return existingToken;
            }
        }

        // Generate new token
        const newToken = generateToken();
        const newExpiry = Date.now() + TOKEN_EXPIRY_MS;

        sessionStorage.setItem(CSRF_TOKEN_KEY, newToken);
        sessionStorage.setItem(CSRF_TOKEN_EXPIRY_KEY, newExpiry.toString());

        return newToken;
    } catch {
        // Fallback if sessionStorage is not available
        return generateToken();
    }
}

/**
 * Clear CSRF token (call on logout)
 */
export function clearCsrfToken(): void {
    try {
        sessionStorage.removeItem(CSRF_TOKEN_KEY);
        sessionStorage.removeItem(CSRF_TOKEN_EXPIRY_KEY);
    } catch {
        // Ignore if sessionStorage not available
    }
}

/**
 * Refresh CSRF token
 */
export function refreshCsrfToken(): string {
    clearCsrfToken();
    return getCsrfToken();
}

// ============================================================================
// CSRF HEADERS FOR FETCH
// ============================================================================

export const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Get headers object with CSRF token included
 */
export function getCsrfHeaders(): Record<string, string> {
    return {
        [CSRF_HEADER_NAME]: getCsrfToken(),
    };
}

/**
 * Wrap fetch with automatic CSRF token injection
 * Use this for state-changing requests (POST, PUT, DELETE, PATCH)
 */
export async function csrfFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const method = options.method?.toUpperCase() || 'GET';

    // Only add CSRF token to state-changing requests
    const needsToken = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

    if (needsToken) {
        options.headers = {
            ...options.headers,
            ...getCsrfHeaders(),
        };
    }

    const response = await fetch(url, options);

    // If we get a 403 with CSRF error, try refreshing token and retry once
    if (response.status === 403) {
        const text = await response.clone().text();
        if (text.toLowerCase().includes('csrf')) {
            refreshCsrfToken();
            options.headers = {
                ...options.headers,
                ...getCsrfHeaders(),
            };
            return fetch(url, options);
        }
    }

    return response;
}

// ============================================================================
// FORM HELPERS
// ============================================================================

/**
 * Hidden input component for CSRF token in forms
 */
export function CsrfTokenInput(): string {
    return `<input type="hidden" name="_csrf" value="${getCsrfToken()}" />`;
}

/**
 * Add CSRF token to form data
 */
export function addCsrfToFormData(formData: FormData): FormData {
    formData.set('_csrf', getCsrfToken());
    return formData;
}

// ============================================================================
// REACT HOOK
// ============================================================================

import { useCallback, useMemo } from 'react';

/**
 * React hook for CSRF protection
 */
export function useCsrf() {
    const token = useMemo(() => getCsrfToken(), []);

    const headers = useMemo(() => getCsrfHeaders(), []);

    const refresh = useCallback(() => {
        return refreshCsrfToken();
    }, []);

    const addToFormData = useCallback((formData: FormData) => {
        return addCsrfToFormData(formData);
    }, []);

    return {
        token,
        headers,
        refresh,
        addToFormData,
        headerName: CSRF_HEADER_NAME,
    };
}

// ============================================================================
// VALIDATION (for edge/serverless functions)
// ============================================================================

/**
 * Validate CSRF token from request
 * For use in Supabase Edge Functions or API routes
 */
export function validateCsrfToken(
    requestToken: string | null,
    sessionToken: string | null
): boolean {
    if (!requestToken || !sessionToken) {
        return false;
    }

    // Constant-time comparison to prevent timing attacks
    if (requestToken.length !== sessionToken.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < requestToken.length; i++) {
        result |= requestToken.charCodeAt(i) ^ sessionToken.charCodeAt(i);
    }

    return result === 0;
}

export default {
    getCsrfToken,
    clearCsrfToken,
    refreshCsrfToken,
    getCsrfHeaders,
    csrfFetch,
    addCsrfToFormData,
    validateCsrfToken,
    useCsrf,
    CSRF_HEADER_NAME,
};
