/**
 * Supabase Edge Function: Generate Group Report
 * Generates reports for group contributions and sends to leaders via WhatsApp
 * 
 * RBAC: Requires STAFF+ role (must have access to the group's institution)
 * Observability: Request ID tracing + audit logging
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { requireStaff, requireInstitution } from '../_shared/rbac.ts';
import type { ReportRequest, ReportResult } from '../_shared/types.ts';

interface GenerateReportRequest {
  groupId: string;
  reportType: 'WEEKLY' | 'MONTHLY' | 'OVERALL';
  periodStart?: string;
  periodEnd?: string;
  sendToLeaders?: boolean;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const functionName = 'generate-group-report';

  try {
    // =========================================================================
    // RBAC: Require STAFF+ role
    // =========================================================================
    const rbacResult = await requireStaff(req, functionName);

    if (!rbacResult.success) {
      return rbacResult.error!;
    }

    const { user, logger, requestId } = rbacResult;
    logger!.info('Processing group report request');

    // =========================================================================
    // Parse request body
    // =========================================================================
    let body: GenerateReportRequest;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400, { 'X-Request-Id': requestId! });
    }

    const { groupId, reportType, periodStart, periodEnd, sendToLeaders = true } = body;

    if (!groupId) {
      return errorResponse('Missing required field: groupId', 400, { 'X-Request-Id': requestId! });
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
      auth: { persistSession: false },
    });

    // =========================================================================
    // Get group and verify institution access
    // =========================================================================
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*, institution:institutions(*)')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return errorResponse('Group not found', 404, { 'X-Request-Id': requestId! });
    }

    // Verify user has access to this group's institution
    const institutionError = requireInstitution(user!, group.institution_id, requestId!, logger!);
    if (institutionError) {
      return institutionError;
    }

    // =========================================================================
    // Calculate period dates
    // =========================================================================
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (reportType === 'WEEKLY') {
      const now = new Date();
      endDate = new Date(now);
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (reportType === 'MONTHLY') {
      const now = new Date();
      endDate = new Date(now);
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (periodStart) startDate = new Date(periodStart);
    if (periodEnd) endDate = new Date(periodEnd);

    logger!.info('Generating report', { groupId, reportType, startDate, endDate });

    // =========================================================================
    // Get group contributions summary
    // =========================================================================
    const { data: summaryData, error: summaryError } = await supabase.rpc(
      'get_group_contributions_summary',
      {
        p_group_id: groupId,
        p_period_start: startDate?.toISOString().split('T')[0] || null,
        p_period_end: endDate?.toISOString().split('T')[0] || null,
      }
    );

    if (summaryError) {
      logger!.error('Failed to get contributions summary', summaryError);
      return errorResponse('Failed to get contributions summary', 500, { 'X-Request-Id': requestId! });
    }

    const summary = summaryData as Record<string, unknown>;

    // Build member contributions
    const memberContributions = (summary?.member_contributions as Array<Record<string, unknown>> || []).map((mc) => ({
      memberId: mc.member_id,
      memberName: mc.member_name,
      phone: mc.phone,
      periodTotal: parseFloat(String(mc.period_total || 0)),
      overallTotal: parseFloat(String(mc.overall_total || 0)),
    }));

    // Build report data
    const reportData = {
      groupId,
      groupName: group.group_name,
      reportType,
      periodStart: startDate?.toISOString().split('T')[0],
      periodEnd: endDate?.toISOString().split('T')[0],
      periodTotal: parseFloat(String(summary?.period_total || 0)),
      overallTotal: parseFloat(String(summary?.overall_total || 0)),
      memberCount: summary?.member_count || 0,
      currency: group.currency || 'RWF',
      memberContributions,
    };

    // =========================================================================
    // Store report in database
    // =========================================================================
    const { data: reportRecord, error: reportError } = await supabase
      .from('group_reports')
      .insert({
        institution_id: group.institution_id,
        group_id: groupId,
        report_type: reportType,
        period_start: startDate?.toISOString().split('T')[0] || null,
        period_end: endDate?.toISOString().split('T')[0] || null,
        summary: {
          total_contributions: reportData.periodTotal,
          overall_total: reportData.overallTotal,
          member_count: reportData.memberCount,
        },
        member_contributions: memberContributions,
        generated_by: user!.userId,
      })
      .select()
      .single();

    if (reportError) {
      logger!.error('Failed to save report', reportError);
      return errorResponse('Failed to save report', 500, { 'X-Request-Id': requestId! });
    }

    // =========================================================================
    // Audit log
    // =========================================================================
    await supabase.from('audit_log').insert({
      actor_user_id: user!.userId,
      institution_id: group.institution_id,
      action: 'generate_report',
      entity_type: 'group_report',
      entity_id: reportRecord.id,
      request_id: requestId,
      metadata: {
        group_id: groupId,
        report_type: reportType,
        period_start: reportData.periodStart,
        period_end: reportData.periodEnd,
        send_to_leaders: sendToLeaders,
      },
    });

    // =========================================================================
    // Send to leaders (if enabled)
    // =========================================================================
    if (sendToLeaders) {
      const { data: leaders, error: leadersError } = await supabase.rpc(
        'get_group_leaders',
        { p_group_id: groupId }
      );

      if (!leadersError && leaders && leaders.length > 0) {
        logger!.info('Would send report to leaders', { leaderCount: leaders.length });
        // TODO: Integrate with send-whatsapp function to send PDF report
      }
    }

    logger!.info('Report generated successfully', { reportId: reportRecord.id });

    const response: ReportResult = {
      success: true,
      data: reportData,
      generatedAt: new Date().toISOString(),
    };

    return jsonResponse({
      ...response,
      reportId: reportRecord.id,
    }, 200, { 'X-Request-Id': requestId! });

  } catch (error) {
    console.error('Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
});
