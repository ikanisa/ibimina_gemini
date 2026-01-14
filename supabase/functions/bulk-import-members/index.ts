/**
 * Supabase Edge Function: Bulk Import Members
 * Bulk import members from CSV data
 * 
 * RBAC: Requires ADMIN role
 * Observability: Request ID tracing + audit logging
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/rbac.ts';
import type { BulkImportResult } from '../_shared/types.ts';

interface MemberRow {
  full_name: string;
  phone: string;
  group_name?: string;
  group_id?: string;
  member_code?: string;
  branch?: string;
}

interface BulkImportRequest {
  members: MemberRow[];
  institution_id?: string;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const functionName = 'bulk-import-members';

  try {
    // =========================================================================
    // RBAC: Require ADMIN role
    // =========================================================================
    const rbacResult = await requireAdmin(req, functionName);

    if (!rbacResult.success) {
      return rbacResult.error!;
    }

    const { user, logger, requestId } = rbacResult;
    logger!.info('Processing bulk import members request');

    // =========================================================================
    // Parse request
    // =========================================================================
    let body: BulkImportRequest;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400, { 'X-Request-Id': requestId! });
    }

    const { members, institution_id } = body;

    if (!members || !Array.isArray(members) || members.length === 0) {
      return errorResponse('Missing or empty members array', 400, { 'X-Request-Id': requestId! });
    }

    const effectiveInstitutionId = institution_id || user!.institutionId;
    if (!effectiveInstitutionId) {
      return errorResponse('Institution ID required', 400, { 'X-Request-Id': requestId! });
    }

    // Cross-institution protection
    if (user!.role !== 'PLATFORM_ADMIN' && effectiveInstitutionId !== user!.institutionId) {
      logger!.warn('Cross-institution import denied');
      return errorResponse('Cannot import to another institution', 403, { 'X-Request-Id': requestId! });
    }

    // =========================================================================
    // Initialize Supabase
    // =========================================================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return errorResponse('Server configuration error', 500, { 'X-Request-Id': requestId! });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // =========================================================================
    // Validate members
    // =========================================================================
    const errors: Array<{ row: number; error: string }> = [];
    const validMembers: Array<MemberRow & { row: number }> = [];

    members.forEach((member, index) => {
      if (!member.full_name || !member.phone) {
        errors.push({ row: index + 1, error: 'Missing required fields: full_name, phone' });
        return;
      }
      if (!member.group_name && !member.group_id) {
        errors.push({ row: index + 1, error: 'Either group_name or group_id required' });
        return;
      }
      validMembers.push({ ...member, row: index + 1 });
    });

    if (errors.length > 0 && validMembers.length === 0) {
      return jsonResponse({ success: false, errors }, 400, { 'X-Request-Id': requestId! });
    }

    // =========================================================================
    // Resolve group IDs
    // =========================================================================
    const groupNameToId = new Map<string, string>();
    const groupNames = [...new Set(validMembers.filter(m => m.group_name).map(m => m.group_name!))];

    if (groupNames.length > 0) {
      const { data: groups } = await supabase
        .from('groups')
        .select('id, group_name')
        .eq('institution_id', effectiveInstitutionId)
        .in('group_name', groupNames);

      groups?.forEach(g => groupNameToId.set(g.group_name, g.id));
    }

    // =========================================================================
    // Insert members
    // =========================================================================
    const results: Array<{ row: number; success: boolean; id?: string; error?: string }> = [];

    for (const member of validMembers) {
      try {
        // Resolve group_id
        let groupId = member.group_id;
        if (!groupId && member.group_name) {
          groupId = groupNameToId.get(member.group_name);
          if (!groupId) {
            results.push({ row: member.row, success: false, error: `Group "${member.group_name}" not found` });
            continue;
          }
        }

        // Validate group belongs to institution
        const { data: group } = await supabase
          .from('groups')
          .select('institution_id')
          .eq('id', groupId)
          .single();

        if (!group || group.institution_id !== effectiveInstitutionId) {
          results.push({ row: member.row, success: false, error: 'Group does not belong to institution' });
          continue;
        }

        // Insert member
        const { data, error } = await supabase
          .from('members')
          .insert({
            institution_id: effectiveInstitutionId,
            full_name: member.full_name,
            phone: member.phone,
            branch: member.branch || null,
            status: 'ACTIVE',
            kyc_status: 'PENDING'
          })
          .select('id')
          .single();

        if (error) {
          results.push({ row: member.row, success: false, error: error.message });
        } else {
          // Create group_members entry
          await supabase.from('group_members').insert({
            institution_id: effectiveInstitutionId,
            group_id: groupId,
            member_id: data.id,
            role: 'MEMBER',
            status: 'GOOD_STANDING'
          });

          results.push({ row: member.row, success: true, id: data.id });
        }
      } catch (error) {
        results.push({ row: member.row, success: false, error: (error as Error).message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length + errors.length;

    // =========================================================================
    // Audit log
    // =========================================================================
    await supabase.from('audit_log').insert({
      actor_user_id: user!.userId,
      institution_id: effectiveInstitutionId,
      action: 'bulk_import_members',
      entity_type: 'member',
      request_id: requestId,
      metadata: {
        total_rows: members.length,
        success_count: successCount,
        error_count: errorCount
      }
    });

    logger!.info('Bulk import completed', { successCount, errorCount });

    const response: BulkImportResult = {
      success: true,
      totalRows: members.length,
      successCount,
      errorCount,
      errors: [...errors, ...results.filter(r => !r.success).map(r => ({ row: r.row, error: r.error! }))],
    };

    return jsonResponse(response, 200, { 'X-Request-Id': requestId! });

  } catch (error) {
    console.error('Bulk import error:', error);
    return errorResponse(
      (error as Error).message || 'Unknown error',
      500
    );
  }
});
