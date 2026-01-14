/**
 * Supabase Edge Function: Bulk Import Groups
 * Bulk import groups from CSV data
 * 
 * RBAC: Requires ADMIN role
 * Observability: Request ID tracing + audit logging
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/rbac.ts';
import type { BulkImportResult } from '../_shared/types.ts';

interface GroupRow {
  group_name: string;
  code?: string;
  expected_amount: number;
  frequency: 'Weekly' | 'Monthly';
  meeting_day?: string;
  currency?: string;
}

interface BulkImportRequest {
  groups: GroupRow[];
  institution_id?: string;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const functionName = 'bulk-import-groups';

  try {
    // =========================================================================
    // RBAC: Require ADMIN role
    // =========================================================================
    const rbacResult = await requireAdmin(req, functionName);

    if (!rbacResult.success) {
      return rbacResult.error!;
    }

    const { user, logger, requestId } = rbacResult;
    logger!.info('Processing bulk import groups request');

    // =========================================================================
    // Parse request
    // =========================================================================
    let body: BulkImportRequest;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400, { 'X-Request-Id': requestId! });
    }

    const { groups, institution_id } = body;

    if (!groups || !Array.isArray(groups) || groups.length === 0) {
      return errorResponse('Missing or empty groups array', 400, { 'X-Request-Id': requestId! });
    }

    const effectiveInstitutionId = institution_id || user!.institutionId;
    if (!effectiveInstitutionId) {
      return errorResponse('Institution ID required', 400, { 'X-Request-Id': requestId! });
    }

    // Platform admins can import to any institution; others only to their own
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
    // Validate and insert groups
    // =========================================================================
    const errors: Array<{ row: number; error: string; data?: Record<string, unknown> }> = [];
    const results: Array<{ row: number; success: boolean; id?: string; error?: string }> = [];

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const rowNum = i + 1;

      // Validation
      if (!group.group_name || !group.expected_amount || !group.frequency) {
        errors.push({ row: rowNum, error: 'Missing required fields: group_name, expected_amount, frequency' });
        continue;
      }
      if (group.frequency !== 'Weekly' && group.frequency !== 'Monthly') {
        errors.push({ row: rowNum, error: 'frequency must be "Weekly" or "Monthly"' });
        continue;
      }

      // Insert
      try {
        const { data, error } = await supabase
          .from('groups')
          .insert({
            institution_id: effectiveInstitutionId,
            group_name: group.group_name,
            code: group.code || null,
            expected_amount: group.expected_amount,
            frequency: group.frequency,
            meeting_day: group.meeting_day || null,
            currency: group.currency || 'RWF',
            status: 'ACTIVE'
          })
          .select('id')
          .single();

        if (error) {
          results.push({ row: rowNum, success: false, error: error.message });
        } else {
          results.push({ row: rowNum, success: true, id: data.id });
        }
      } catch (error) {
        results.push({ row: rowNum, success: false, error: (error as Error).message });
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
      action: 'bulk_import_groups',
      entity_type: 'group',
      request_id: requestId,
      metadata: {
        total_rows: groups.length,
        success_count: successCount,
        error_count: errorCount
      }
    });

    logger!.info('Bulk import completed', { successCount, errorCount });

    const response: BulkImportResult = {
      success: true,
      totalRows: groups.length,
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
