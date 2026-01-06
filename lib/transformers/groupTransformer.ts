/**
 * Group Data Transformers
 * 
 * Transforms Supabase group data to UI-friendly formats
 */

import type { SupabaseGroup, Group } from '../../types';

/**
 * Transform Supabase group to UI group
 */
export function transformGroup(
  group: SupabaseGroup,
  memberCount: number = 0
): Group {
  return {
    id: group.id,
    name: group.group_name,
    code: group.id.substring(0, 8).toUpperCase(),
    saccoId: group.institution_id,
    branch: 'Main', // Could be enhanced to fetch from institution
    status: group.status === 'ACTIVE' 
      ? 'Active' 
      : group.status === 'PAUSED' 
        ? 'Suspended' 
        : 'Completed',
    cycleLabel: group.cycle_label ?? 'Current Cycle',
    memberCount,
    meetingDay: group.meeting_day ?? 'Monday',
    contributionAmount: group.expected_amount,
    contributionFrequency: group.frequency === 'Weekly' ? 'Weekly' : 'Monthly',
    fundBalance: group.fund_balance ?? 0,
    activeLoansCount: group.active_loans_count ?? 0,
    nextMeeting: group.next_meeting_date ?? 'TBD'
  };
}

/**
 * Transform multiple Supabase groups to UI groups
 */
export function transformGroups(
  groups: SupabaseGroup[],
  memberCounts: Record<string, number> = {}
): Group[] {
  return groups.map(group => 
    transformGroup(group, memberCounts[group.id] || 0)
  );
}

