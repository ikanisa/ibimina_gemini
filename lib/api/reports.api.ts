/**
 * Reports API Service
 * Handles group report generation and notification sending
 */

import { supabase } from '../supabase';

export interface GenerateReportParams {
  groupId: string;
  reportType: 'WEEKLY' | 'MONTHLY' | 'OVERALL';
  periodStart?: string;
  periodEnd?: string;
  sendToLeaders?: boolean;
}

export interface GroupReport {
  id: string;
  institution_id: string;
  group_id: string;
  report_type: 'WEEKLY' | 'MONTHLY' | 'OVERALL';
  period_start?: string | null;
  period_end?: string | null;
  pdf_url?: string | null;
  pdf_storage_path?: string | null;
  summary: {
    total_contributions: number;
    overall_total: number;
    member_count: number;
  };
  member_contributions: Array<{
    member_id: string;
    member_name: string;
    phone: string;
    period_total: number;
    overall_total: number;
  }>;
  generated_at: string;
  generated_by?: string | null;
  sent_to_leaders: boolean;
  sent_at?: string | null;
}

/**
 * Generate a group report
 */
export async function generateGroupReport(
  params: GenerateReportParams
): Promise<GroupReport> {
  const { data, error } = await supabase.functions.invoke('generate-group-report', {
    body: params,
  });

  if (error) {
    throw new Error(`Failed to generate report: ${error.message}`);
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to generate report');
  }

  // Fetch the created report
  const { data: report, error: fetchError } = await supabase
    .from('group_reports')
    .select('*')
    .eq('id', data.reportId)
    .single();

  if (fetchError || !report) {
    throw new Error('Failed to fetch generated report');
  }

  return report as GroupReport;
}

/**
 * Get group reports
 */
export async function getGroupReports(
  groupId: string,
  limit: number = 10
): Promise<GroupReport[]> {
  const { data, error } = await supabase
    .from('group_reports')
    .select('*')
    .eq('group_id', groupId)
    .order('generated_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch reports: ${error.message}`);
  }

  return (data || []) as GroupReport[];
}

/**
 * Get member contributions summary
 */
export async function getMemberContributionsSummary(
  memberId: string,
  groupId: string,
  periodStart?: string,
  periodEnd?: string
): Promise<{
  period_total: number;
  overall_total: number;
  period_count: number;
  overall_count: number;
}> {
  const { data, error } = await supabase.rpc('get_member_contributions_summary', {
    p_member_id: memberId,
    p_group_id: groupId,
    p_period_start: periodStart || null,
    p_period_end: periodEnd || null,
  });

  if (error) {
    throw new Error(`Failed to get contributions summary: ${error.message}`);
  }

  return data as {
    period_total: number;
    overall_total: number;
    period_count: number;
    overall_count: number;
  };
}

/**
 * Get group contributions summary
 */
export async function getGroupContributionsSummary(
  groupId: string,
  periodStart?: string,
  periodEnd?: string
): Promise<{
  period_total: number;
  overall_total: number;
  member_count: number;
  member_contributions: Array<{
    member_id: string;
    member_name: string;
    phone: string;
    period_total: number;
    overall_total: number;
  }>;
}> {
  const { data, error } = await supabase.rpc('get_group_contributions_summary', {
    p_group_id: groupId,
    p_period_start: periodStart || null,
    p_period_end: periodEnd || null,
  });

  if (error) {
    throw new Error(`Failed to get group summary: ${error.message}`);
  }

  return data as {
    period_total: number;
    overall_total: number;
    member_count: number;
    member_contributions: Array<{
      member_id: string;
      member_name: string;
      phone: string;
      period_total: number;
      overall_total: number;
    }>;
  };
}

/**
 * Get group leaders
 */
export async function getGroupLeaders(groupId: string): Promise<Array<{
  member_id: string;
  member_name: string;
  phone: string;
  role: string;
}>> {
  const { data, error } = await supabase.rpc('get_group_leaders', {
    p_group_id: groupId,
  });

  if (error) {
    throw new Error(`Failed to get group leaders: ${error.message}`);
  }

  return (data || []) as Array<{
    member_id: string;
    member_name: string;
    phone: string;
    role: string;
  }>;
}
