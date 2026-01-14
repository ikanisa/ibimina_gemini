/**
 * Supabase Edge Function: Staff Invite
 * Creates a new staff member via Supabase Auth
 * 
 * RBAC: Requires ADMIN role
 * Observability: Request ID tracing + audit logging
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/rbac.ts';

// Map UI-friendly role names to database enum values
const mapRoleToEnum = (role: string | null): string => {
  if (!role) return 'STAFF';
  const roleUpper = role.toUpperCase();

  if (roleUpper === 'ADMIN' || roleUpper === 'PLATFORM_ADMIN' || roleUpper === 'INSTITUTION_ADMIN' || roleUpper === 'SUPER ADMIN' || roleUpper === 'BRANCH MANAGER') {
    return 'ADMIN';
  }

  return 'STAFF';
};

interface StaffInviteRequest {
  email: string;
  full_name?: string;
  role?: string;
  institution_id?: string;
  onboarding_method?: 'password' | 'email';
  password?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const functionName = 'staff-invite';

  try {
    // =========================================================================
    // RBAC: Require authenticated ADMIN role
    // =========================================================================
    const rbacResult = await requireAdmin(req, functionName);

    if (!rbacResult.success) {
      return rbacResult.error!;
    }

    const { user, logger, requestId } = rbacResult;
    logger!.info('Processing staff invite request', { invitedBy: user!.userId });

    // =========================================================================
    // Parse and validate request body
    // =========================================================================
    let body: StaffInviteRequest;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400, { 'X-Request-Id': requestId! });
    }

    const email = String(body.email ?? '').trim().toLowerCase();
    const fullName = String(body.full_name ?? '').trim();
    const role = mapRoleToEnum(body.role ?? null);
    const institutionId = body.institution_id ?? user!.institutionId;
    const onboardingMethod = body.onboarding_method ?? 'password';
    const password = body.password ?? 'Sacco+'; // Default password

    if (!email) {
      return errorResponse('Email is required', 400, { 'X-Request-Id': requestId! });
    }

    if (!institutionId && role !== 'ADMIN') {
      return errorResponse('Institution ID is required', 400, { 'X-Request-Id': requestId! });
    }

    // Platform admins can invite to any institution; others only to their own
    if (user!.role !== 'PLATFORM_ADMIN' && institutionId !== user!.institutionId) {
      logger!.warn('Cross-institution invite denied', {
        userInstitution: user!.institutionId,
        targetInstitution: institutionId
      });
      return errorResponse('Cannot invite staff to another institution', 403, { 'X-Request-Id': requestId! });
    }

    // =========================================================================
    // Initialize Supabase client with service role
    // =========================================================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      logger!.error('Missing Supabase configuration');
      return errorResponse('Server configuration error', 500, { 'X-Request-Id': requestId! });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // =========================================================================
    // Create staff_invites record
    // =========================================================================
    let inviteId: string | null = null;
    if (institutionId) {
      const { data: inviteData, error: inviteError } = await supabase
        .from('staff_invites')
        .insert({
          email,
          institution_id: institutionId,
          role,
          invited_by: user!.userId,
          status: 'pending'
        })
        .select('id')
        .single();

      if (inviteError && !inviteError.message.includes('duplicate')) {
        logger!.warn('Error creating invite record', { error: inviteError.message });
      } else if (inviteData) {
        inviteId = inviteData.id;
      }
    }

    // =========================================================================
    // Create user via Supabase Auth
    // =========================================================================
    const inviteResult =
      onboardingMethod === 'password'
        ? await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role,
            institution_id: institutionId
          }
        })
        : await supabase.auth.admin.inviteUserByEmail(email, {
          data: {
            full_name: fullName,
            role,
            institution_id: institutionId
          }
        });

    if (inviteResult.error || !inviteResult.data.user) {
      // Update invite status to failed
      if (inviteId) {
        await supabase
          .from('staff_invites')
          .update({
            status: 'expired',
            metadata: { error: inviteResult.error?.message, request_id: requestId }
          })
          .eq('id', inviteId);
      }

      logger!.error('Failed to create user', { error: inviteResult.error?.message });
      return errorResponse(inviteResult.error?.message ?? 'Failed to invite staff', 400, { 'X-Request-Id': requestId! });
    }

    const newUser = inviteResult.data.user;
    logger!.info('User created', { newUserId: newUser.id, email });

    // =========================================================================
    // Create/update profile
    // =========================================================================
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: newUser.id,
        institution_id: institutionId,
        role,
        email,
        full_name: fullName,
        is_active: true,
        status: 'ACTIVE'
      })
      .select('*')
      .single();

    if (profileError) {
      logger!.error('Failed to create profile', { error: profileError.message });
      return errorResponse(profileError.message, 400, { 'X-Request-Id': requestId! });
    }

    // Update invite status if password method
    if (inviteId && onboardingMethod === 'password') {
      await supabase
        .from('staff_invites')
        .update({
          status: 'accepted',
          accepted_by: newUser.id,
          accepted_at: new Date().toISOString()
        })
        .eq('id', inviteId);
    }

    // =========================================================================
    // Audit log
    // =========================================================================
    await supabase.from('audit_log').insert({
      actor_user_id: user!.userId,
      institution_id: institutionId,
      action: 'invite_staff',
      entity_type: 'profile',
      entity_id: newUser.id,
      request_id: requestId,
      metadata: {
        email,
        role,
        method: onboardingMethod,
        invite_id: inviteId
      }
    });

    logger!.info('Staff invite completed', { newUserId: newUser.id, inviteId });

    return jsonResponse({
      success: true,
      profile,
      invite_id: inviteId
    }, 200, { 'X-Request-Id': requestId! });

  } catch (error) {
    console.error('Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
});
