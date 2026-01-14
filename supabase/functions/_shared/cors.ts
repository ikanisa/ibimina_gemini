/**
 * Shared CORS Headers for Edge Functions
 * Standardizes CORS configuration across all functions
 */

export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-signature, x-request-id',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Expose-Headers': 'x-request-id, x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset',
};

/**
 * Handle CORS preflight request
 */
export function handleCors(req: Request): Response | null {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }
    return null;
}

/**
 * Create JSON response with CORS headers
 */
export function jsonResponse<T>(
    data: T,
    status = 200,
    extraHeaders: Record<string, string> = {}
): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            ...extraHeaders,
        },
    });
}

/**
 * Create error response with CORS headers
 */
export function errorResponse(
    error: string,
    status = 400,
    extraHeaders: Record<string, string> = {}
): Response {
    return new Response(JSON.stringify({ success: false, error }), {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            ...extraHeaders,
        },
    });
}
