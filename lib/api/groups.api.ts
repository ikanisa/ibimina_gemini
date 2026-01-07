/**
 * Groups API Service
 * 
 * Centralized service for all group-related database operations
 */

import { supabase } from '../supabase';
import type { SupabaseGroup, SupabaseGroupMember, SupabaseMeeting, SupabaseContribution } from '../../types';

export interface CreateGroupParams {
  institution_id: string;
  group_name: string;
  meeting_day?: string;
  expected_amount: number;
  frequency: 'Weekly' | 'Monthly';
  cycle_label?: string;
  grace_days?: number;
  bank_name?: string;
  account_ref?: string;
  currency?: string;
  status?: 'ACTIVE' | 'PAUSED' | 'CLOSED';
}

export interface UpdateGroupParams {
  group_name?: string;
  meeting_day?: string;
  expected_amount?: number;
  frequency?: 'Weekly' | 'Monthly';
  cycle_label?: string;
  status?: 'ACTIVE' | 'PAUSED' | 'CLOSED';
  fund_balance?: number;
  active_loans_count?: number;
  next_meeting_date?: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all groups for an institution with optional pagination
 */
export async function fetchGroups(institutionId: string, options: PaginationOptions = {}) {
  const { limit, offset = 0 } = options;
  
  let query = supabase
    .from('groups')
    .select('*')
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: false });

  if (limit !== undefined) {
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch groups: ${error.message}`);
  }

  return data as SupabaseGroup[];
}

/**
 * Fetch groups with member counts with optional pagination
 */
export async function fetchGroupsWithMemberCounts(institutionId: string, options: PaginationOptions = {}) {
  const { limit, offset = 0 } = options;
  
  let query = supabase
    .from('groups')
    .select('*')
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: false });

  if (limit !== undefined) {
    query = query.range(offset, offset + limit - 1);
  }

  const { data: groups, error: groupsError } = await query;

  if (groupsError) {
    throw new Error(`Failed to fetch groups: ${groupsError.message}`);
  }

  // Only fetch member counts for the groups we loaded
  const groupIds = (groups || []).map(g => g.id);
  
  if (groupIds.length === 0) {
    return { groups: [] as SupabaseGroup[], memberCounts: {} };
  }

  const { data: memberData, error: memberError } = await supabase
    .from('group_members')
    .select('group_id')
    .in('group_id', groupIds);

  if (memberError) {
    console.warn('Failed to fetch group members:', memberError);
  }

  const memberCounts = (memberData || []).reduce((acc, row) => {
    acc[row.group_id] = (acc[row.group_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    groups: (groups || []) as SupabaseGroup[],
    memberCounts
  };
}

/**
 * Fetch a single group by ID
 */
export async function fetchGroupById(groupId: string) {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch group: ${error.message}`);
  }

  return data as SupabaseGroup;
}

/**
 * Create a new group
 */
export async function createGroup(params: CreateGroupParams) {
  const { data, error } = await supabase
    .from('groups')
    .insert({
      institution_id: params.institution_id,
      group_name: params.group_name.trim(),
      meeting_day: params.meeting_day || 'Monday',
      expected_amount: params.expected_amount,
      frequency: params.frequency,
      cycle_label: params.cycle_label || `Cycle ${new Date().getFullYear()}`,
      grace_days: params.grace_days || 0,
      bank_name: params.bank_name,
      account_ref: params.account_ref,
      currency: params.currency || 'RWF',
      status: params.status || 'ACTIVE'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create group: ${error.message}`);
  }

  return data as SupabaseGroup;
}

/**
 * Update an existing group
 */
export async function updateGroup(groupId: string, params: UpdateGroupParams) {
  const { data, error } = await supabase
    .from('groups')
    .update(params)
    .eq('id', groupId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update group: ${error.message}`);
  }

  return data as SupabaseGroup;
}

/**
 * Delete a group (soft delete by setting status to CLOSED)
 */
export async function deleteGroup(groupId: string) {
  const { error } = await supabase
    .from('groups')
    .update({ status: 'CLOSED' })
    .eq('id', groupId);

  if (error) {
    throw new Error(`Failed to delete group: ${error.message}`);
  }
}

/**
 * Fetch group members
 */
export async function fetchGroupMembers(groupId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select('id, member_id, role, status, joined_date, members(full_name)')
    .eq('group_id', groupId);

  if (error) {
    throw new Error(`Failed to fetch group members: ${error.message}`);
  }

  return data as Array<SupabaseGroupMember & { members?: { full_name?: string | null } }>;
}

/**
 * Fetch group meetings
 */
export async function fetchGroupMeetings(groupId: string) {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('group_id', groupId)
    .order('date', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch group meetings: ${error.message}`);
  }

  return data as SupabaseMeeting[];
}

/**
 * Fetch group contributions
 */
export async function fetchGroupContributions(groupId: string) {
  const { data, error } = await supabase
    .from('contributions')
    .select('*')
    .eq('group_id', groupId)
    .order('date', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch group contributions: ${error.message}`);
  }

  return data as SupabaseContribution[];
}

/**
 * Fetch all group details (members, meetings, contributions) in parallel
 */
export async function fetchGroupDetails(groupId: string) {
  const [membersResult, meetingsResult, contributionsResult] = await Promise.all([
    fetchGroupMembers(groupId).catch(err => ({ error: err.message, data: [] })),
    fetchGroupMeetings(groupId).catch(err => ({ error: err.message, data: [] })),
    fetchGroupContributions(groupId).catch(err => ({ error: err.message, data: [] }))
  ]);

  return {
    members: Array.isArray(membersResult) ? membersResult : membersResult.data || [],
    meetings: Array.isArray(meetingsResult) ? meetingsResult : meetingsResult.data || [],
    contributions: Array.isArray(contributionsResult) ? contributionsResult : contributionsResult.data || [],
    errors: {
      members: Array.isArray(membersResult) ? null : membersResult.error,
      meetings: Array.isArray(meetingsResult) ? null : meetingsResult.error,
      contributions: Array.isArray(contributionsResult) ? null : contributionsResult.error
    }
  };
}

/**
 * Search groups by name
 */
export async function searchGroups(institutionId: string, searchTerm: string) {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('institution_id', institutionId)
    .ilike('group_name', `%${searchTerm}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Failed to search groups: ${error.message}`);
  }

  return data as SupabaseGroup[];
}
