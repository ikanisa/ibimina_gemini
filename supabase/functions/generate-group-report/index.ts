/**
 * Supabase Edge Function: Generate Group Report
 * Generates PDF reports for group contributions and sends to leaders via WhatsApp
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateReportRequest {
  groupId: string;
  reportType: 'WEEKLY' | 'MONTHLY' | 'OVERALL';
  periodStart?: string;
  periodEnd?: string;
  sendToLeaders?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const body: GenerateReportRequest = await req.json();
    const { groupId, reportType, periodStart, periodEnd, sendToLeaders = true } = body;

    // Get group information
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*, institution:institutions(*)')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return new Response(
        JSON.stringify({ error: 'Group not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate period dates if not provided
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

    // Get group contributions summary
    const { data: summaryData, error: summaryError } = await supabase.rpc(
      'get_group_contributions_summary',
      {
        p_group_id: groupId,
        p_period_start: startDate?.toISOString().split('T')[0] || null,
        p_period_end: endDate?.toISOString().split('T')[0] || null,
      }
    );

    if (summaryError) {
      console.error('Summary error:', summaryError);
      return new Response(
        JSON.stringify({ error: 'Failed to get contributions summary' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const summary = summaryData as any;

    // Get member contributions
    const memberContributions = (summary.member_contributions || []).map((mc: any) => ({
      memberId: mc.member_id,
      memberName: mc.member_name,
      phone: mc.phone,
      periodTotal: parseFloat(mc.period_total || 0),
      overallTotal: parseFloat(mc.overall_total || 0),
      periodCount: 0, // Could be calculated from transactions
      overallCount: 0,
    }));

    // Generate PDF (this would use a PDF library like pdfkit or puppeteer)
    // For now, we'll create a placeholder and store the report data
    const reportData = {
      groupId,
      groupName: group.group_name,
      reportType,
      periodStart: startDate?.toISOString().split('T')[0],
      periodEnd: endDate?.toISOString().split('T')[0],
      periodTotal: parseFloat(summary.period_total || 0),
      overallTotal: parseFloat(summary.overall_total || 0),
      memberCount: summary.member_count || 0,
      currency: group.currency || 'RWF',
      memberContributions,
    };

    // Store report in database
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
        generated_by: (await supabase.auth.getUser()).data.user?.id || null,
      })
      .select()
      .single();

    if (reportError) {
      console.error('Report save error:', reportError);
      return new Response(
        JSON.stringify({ error: 'Failed to save report' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Generate actual PDF and upload to Supabase Storage
    // For now, we'll just return the report data
    // In production, you'd use a PDF library to generate the PDF,
    // upload it to Supabase Storage, and get the public URL

    // If sendToLeaders is true, send report to group leaders
    if (sendToLeaders) {
      // Get group leaders
      const { data: leaders, error: leadersError } = await supabase.rpc(
        'get_group_leaders',
        { p_group_id: groupId }
      );

      if (!leadersError && leaders && leaders.length > 0) {
        // Send report to each leader via WhatsApp
        // This would call the notification service
        // For now, we'll just log it
        console.log(`Would send report to ${leaders.length} leaders`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reportId: reportRecord.id,
        reportData,
        message: 'Report generated successfully',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
