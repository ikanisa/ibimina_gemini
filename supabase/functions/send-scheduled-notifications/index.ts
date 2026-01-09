/**
 * Supabase Edge Function: Send Scheduled Notifications
 * Sends weekly contribution reminders and periodic reports
 * This function should be called by a cron job (pg_cron or external scheduler)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationJob {
  type: 'CONTRIBUTION_REMINDER' | 'PERIODIC_REPORT' | 'GROUP_REPORT';
  institutionId?: string;
  groupId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify request (should be from cron job with secret)
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');
    
    if (cronSecret !== expectedSecret && expectedSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const body: NotificationJob = await req.json();
    const { type, institutionId, groupId } = body;

    let results: any[] = [];

    if (type === 'CONTRIBUTION_REMINDER') {
      // Send weekly contribution reminders
      results = await sendContributionReminders(supabase, institutionId);
    } else if (type === 'PERIODIC_REPORT') {
      // Send periodic totals to members
      results = await sendPeriodicReports(supabase, institutionId, groupId);
    } else if (type === 'GROUP_REPORT') {
      // Generate and send group reports to leaders
      results = await generateAndSendGroupReports(supabase, institutionId, groupId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
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

/**
 * Send contribution reminders to all active members
 */
async function sendContributionReminders(
  supabase: any,
  institutionId?: string
): Promise<any[]> {
  // Get all active groups
  let query = supabase
    .from('groups')
    .select('*, group_members!inner(member:members(*))')
    .eq('status', 'ACTIVE');

  if (institutionId) {
    query = query.eq('institution_id', institutionId);
  }

  const { data: groups, error } = await query;

  if (error) {
    console.error('Error fetching groups:', error);
    return [];
  }

  const results: any[] = [];

  for (const group of groups || []) {
    // Get members who haven't contributed this period
    const now = new Date();
    let periodStart: Date;

    if (group.frequency === 'Weekly') {
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 7);
    } else {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get members with recent contributions
    const { data: recentContributions } = await supabase
      .from('transactions')
      .select('member_id')
      .eq('group_id', group.id)
      .eq('type', 'CONTRIBUTION')
      .gte('occurred_at', periodStart.toISOString());

    const contributedMemberIds = new Set(
      (recentContributions || []).map((c: any) => c.member_id)
    );

    // Send reminders to members who haven't contributed
    for (const gm of group.group_members || []) {
      const member = gm.member;
      if (!member || contributedMemberIds.has(member.id)) {
        continue;
      }

      // Calculate due date
      const dueDate = new Date(now);
      if (group.frequency === 'Weekly') {
        dueDate.setDate(now.getDate() + group.grace_days);
      } else {
        dueDate.setDate(now.getDate() + group.grace_days);
      }

      // Call notification service (would be done via another Edge Function)
      results.push({
        memberId: member.id,
        memberName: member.full_name,
        groupId: group.id,
        groupName: group.group_name,
        status: 'pending',
      });
    }
  }

  return results;
}

/**
 * Send periodic totals to members
 */
async function sendPeriodicReports(
  supabase: any,
  institutionId?: string,
  groupId?: string
): Promise<any[]> {
  // Get groups (filter by institution/group if provided)
  let query = supabase
    .from('groups')
    .select('*, group_members!inner(member:members(*))')
    .eq('status', 'ACTIVE');

  if (institutionId) {
    query = query.eq('institution_id', institutionId);
  }
  if (groupId) {
    query = query.eq('id', groupId);
  }

  const { data: groups, error } = await query;

  if (error) {
    console.error('Error fetching groups:', error);
    return [];
  }

  const results: any[] = [];
  const now = new Date();

  for (const group of groups || []) {
    // Determine period
    let periodStart: Date;
    let periodLabel: string;

    if (group.daily_contribution) {
      // For daily contribution groups, send weekly report
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 7);
      periodLabel = `Week of ${periodStart.toLocaleDateString()}`;
    } else if (group.frequency === 'Weekly') {
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 7);
      periodLabel = `Week of ${periodStart.toLocaleDateString()}`;
    } else {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    // Send to each member
    for (const gm of group.group_members || []) {
      const member = gm.member;
      if (!member) continue;

      // Get member contributions summary
      const { data: summary } = await supabase.rpc('get_member_contributions_summary', {
        p_member_id: member.id,
        p_group_id: group.id,
        p_period_start: periodStart.toISOString().split('T')[0],
        p_period_end: now.toISOString().split('T')[0],
      });

      if (summary) {
        results.push({
          memberId: member.id,
          memberName: member.full_name,
          groupId: group.id,
          periodLabel,
          periodTotal: summary.period_total,
          overallTotal: summary.overall_total,
          status: 'pending',
        });
      }
    }
  }

  return results;
}

/**
 * Generate and send group reports to leaders
 */
async function generateAndSendGroupReports(
  supabase: any,
  institutionId?: string,
  groupId?: string
): Promise<any[]> {
  // Get groups
  let query = supabase
    .from('groups')
    .select('*')
    .eq('status', 'ACTIVE');

  if (institutionId) {
    query = query.eq('institution_id', institutionId);
  }
  if (groupId) {
    query = query.eq('id', groupId);
  }

  const { data: groups, error } = await query;

  if (error) {
    console.error('Error fetching groups:', error);
    return [];
  }

  const results: any[] = [];
  const now = new Date();

  for (const group of groups || []) {
    // Determine report type and period
    let reportType: 'WEEKLY' | 'MONTHLY' | 'OVERALL';
    let periodStart: Date | null = null;
    let periodEnd: Date | null = null;

    if (group.daily_contribution) {
      // For daily contribution groups, generate weekly report
      reportType = 'WEEKLY';
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 7);
      periodEnd = new Date(now);
    } else if (group.frequency === 'Weekly') {
      reportType = 'WEEKLY';
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 7);
      periodEnd = new Date(now);
    } else {
      reportType = 'MONTHLY';
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now);
    }

    // Call generate-group-report function
    // This would be done via HTTP call to the other Edge Function
    results.push({
      groupId: group.id,
      groupName: group.group_name,
      reportType,
      periodStart: periodStart?.toISOString().split('T')[0],
      periodEnd: periodEnd?.toISOString().split('T')[0],
      status: 'pending',
    });
  }

  return results;
}
