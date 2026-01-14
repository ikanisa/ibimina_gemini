/**
 * RBAC (Role-Based Access Control) for Edge Functions
 * Server-side enforcement - never trust the client
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, errorResponse } from './cors.ts';
import { RequestContext, getRequestId, createLogger, Logger } from './request-context.ts';

// ============================================================================
// TYPES
// ============================================================================

export type UserRole =
    | 'PLATFORM_ADMIN'
    | 'INSTITUTION_ADMIN'
    | 'INSTITUTION_STAFF'
    | 'INSTITUTION_TREASURER'
    | 'INSTITUTION_AUDITOR'
    | 'ADMIN'  // Simplified role
    | 'STAFF'; // Simplified role

export interface AuthenticatedUser {
    userId: string;
    email: string | null;
    role: UserRole;
    institutionId: string | null;
}

export interface RbacResult {
    success: boolean;
    user?: AuthenticatedUser;
    error?: Response;
    logger?: Logger;
    requestId?: string;
}

// Role hierarchy (higher can do what lower can)
const ROLE_HIERARCHY: Record<UserRole, number> = {
    'PLATFORM_ADMIN': 100,
    'INSTITUTION_ADMIN': 80,
    'ADMIN': 80, // Same as INSTITUTION_ADMIN
    'INSTITUTION_TREASURER': 60,
    'INSTITUTION_STAFF': 40,
    'STAFF': 40, // Same as INSTITUTION_STAFF
    'INSTITUTION_AUDITOR': 20, // Read-only
};

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Require authentication - returns user or 401 response
 */
export async function requireAuth(
    req: Request,
    functionName: string
): Promise<RbacResult> {
    const requestId = getRequestId(req);
    const logger = createLogger(requestId, functionName);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        logger.warn('Missing or invalid Authorization header');
        return {
            success: false,
            error: errorResponse('Missing authorization header', 401, { 'X-Request-Id': requestId }),
            requestId,
            logger,
        };
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token with Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
        logger.error('Missing Supabase configuration');
        return {
            success: false,
            error: errorResponse('Server configuration error', 500, { 'X-Request-Id': requestId }),
            requestId,
            logger,
        };
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
    });

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
        logger.warn('Invalid or expired token', { error: authError?.message });
        return {
            success: false,
            error: errorResponse('Invalid or expired token', 401, { 'X-Request-Id': requestId }),
            requestId,
            logger,
        };
    }

    // Get profile for role and institution
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, institution_id, status')
        .eq('user_id', user.id)
        .single();

    if (profileError || !profile) {
        logger.warn('User profile not found', { userId: user.id });
        return {
            success: false,
            error: errorResponse('User profile not found', 403, { 'X-Request-Id': requestId }),
            requestId,
            logger,
        };
    }

    // Check if user is suspended
    if (profile.status === 'SUSPENDED') {
        logger.warn('User account suspended', { userId: user.id });
        return {
            success: false,
            error: errorResponse('Account suspended', 403, { 'X-Request-Id': requestId }),
            requestId,
            logger,
        };
    }

    const authenticatedUser: AuthenticatedUser = {
        userId: user.id,
        email: user.email || null,
        role: profile.role as UserRole,
        institutionId: profile.institution_id,
    };

    logger.info('User authenticated', {
        userId: user.id,
        role: profile.role,
        institution: profile.institution_id,
    });

    return {
        success: true,
        user: authenticatedUser,
        requestId,
        logger,
    };
}

// ============================================================================
// AUTHORIZATION
// ============================================================================

/**
 * Check if user has required role
 */
export function hasRole(user: AuthenticatedUser, allowedRoles: UserRole[]): boolean {
    return allowedRoles.includes(user.role);
}

/**
 * Check if user's role is at least at a certain level
 */
export function hasMinimumRole(user: AuthenticatedUser, minimumRole: UserRole): boolean {
    const userLevel = ROLE_HIERARCHY[user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;
    return userLevel >= requiredLevel;
}

/**
 * Require specific roles - returns 403 if not authorized
 */
export function requireRole(
    user: AuthenticatedUser,
    allowedRoles: UserRole[],
    requestId: string,
    logger: Logger
): Response | null {
    if (!hasRole(user, allowedRoles)) {
        logger.warn('Insufficient permissions', {
            userId: user.userId,
            userRole: user.role,
            requiredRoles: allowedRoles,
        });
        return errorResponse(
            `Insufficient permissions. Required role: ${allowedRoles.join(' or ')}`,
            403,
            { 'X-Request-Id': requestId }
        );
    }
    return null;
}

/**
 * Require minimum role level - returns 403 if not authorized
 */
export function requireMinimumRole(
    user: AuthenticatedUser,
    minimumRole: UserRole,
    requestId: string,
    logger: Logger
): Response | null {
    if (!hasMinimumRole(user, minimumRole)) {
        logger.warn('Insufficient role level', {
            userId: user.userId,
            userRole: user.role,
            minimumRequired: minimumRole,
        });
        return errorResponse(
            `Insufficient permissions. Required minimum role: ${minimumRole}`,
            403,
            { 'X-Request-Id': requestId }
        );
    }
    return null;
}

/**
 * Require access to specific institution - returns 403 if not authorized
 */
export function requireInstitution(
    user: AuthenticatedUser,
    institutionId: string,
    requestId: string,
    logger: Logger
): Response | null {
    // Platform admins can access any institution
    if (user.role === 'PLATFORM_ADMIN') {
        return null;
    }

    if (user.institutionId !== institutionId) {
        logger.warn('Cross-institution access denied', {
            userId: user.userId,
            userInstitution: user.institutionId,
            requestedInstitution: institutionId,
        });
        return errorResponse(
            'Access denied to this institution',
            403,
            { 'X-Request-Id': requestId }
        );
    }
    return null;
}

// ============================================================================
// CONVENIENCE HELPERS
// ============================================================================

/**
 * Full RBAC check: auth + role
 * Returns authenticated user or error response
 */
export async function requireAuthAndRole(
    req: Request,
    functionName: string,
    allowedRoles: UserRole[]
): Promise<RbacResult> {
    const authResult = await requireAuth(req, functionName);

    if (!authResult.success) {
        return authResult;
    }

    const roleError = requireRole(
        authResult.user!,
        allowedRoles,
        authResult.requestId!,
        authResult.logger!
    );

    if (roleError) {
        return {
            success: false,
            error: roleError,
            requestId: authResult.requestId,
            logger: authResult.logger,
        };
    }

    return authResult;
}

/**
 * Admin-only access (ADMIN, INSTITUTION_ADMIN, PLATFORM_ADMIN)
 */
export async function requireAdmin(
    req: Request,
    functionName: string
): Promise<RbacResult> {
    return requireAuthAndRole(req, functionName, [
        'ADMIN',
        'INSTITUTION_ADMIN',
        'PLATFORM_ADMIN',
    ]);
}

/**
 * Staff-or-above access (STAFF+)
 */
export async function requireStaff(
    req: Request,
    functionName: string
): Promise<RbacResult> {
    return requireAuthAndRole(req, functionName, [
        'STAFF',
        'INSTITUTION_STAFF',
        'INSTITUTION_TREASURER',
        'ADMIN',
        'INSTITUTION_ADMIN',
        'PLATFORM_ADMIN',
    ]);
}
