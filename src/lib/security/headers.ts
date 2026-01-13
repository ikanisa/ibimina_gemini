/**
 * Security Headers Configuration
 * For use with Cloudflare Pages _headers file or middleware
 */

// ============================================================================
// SECURITY HEADERS
// ============================================================================

export const securityHeaders = {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Enable XSS filter in older browsers
    'X-XSS-Protection': '1; mode=block',

    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions Policy (formerly Feature Policy)
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',

    // Content Security Policy
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ].join('; '),

    // Strict Transport Security (HTTPS only)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

// ============================================================================
// CACHE HEADERS
// ============================================================================

export const cacheHeaders = {
    // Static assets - cache for 1 year
    static: {
        'Cache-Control': 'public, max-age=31536000, immutable',
    },

    // HTML - no cache
    html: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
    },

    // API responses - short cache
    api: {
        'Cache-Control': 'private, max-age=60',
    },
};

// ============================================================================
// APPLY HEADERS TO RESPONSE
// ============================================================================

/**
 * Apply security headers to a Response object
 * For use in service workers or edge functions
 */
export function applySecurityHeaders(response: Response): Response {
    const headers = new Headers(response.headers);

    Object.entries(securityHeaders).forEach(([key, value]) => {
        headers.set(key, value);
    });

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

/**
 * Create headers object for fetch responses
 */
export function getSecurityHeadersObject(): Record<string, string> {
    return { ...securityHeaders };
}

// ============================================================================
// CLOUDFLARE PAGES _headers FILE CONTENT
// ============================================================================

export const cloudflareHeadersFile = `
# Security Headers for Cloudflare Pages
# Place this file in /public/_headers

/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

# Cache static assets
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Don't cache HTML
/*.html
  Cache-Control: no-cache, no-store, must-revalidate
`;

export default securityHeaders;
