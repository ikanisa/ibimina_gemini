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

  // Calculate member counts from groups.members JSONB array
  const memberCounts = (groups || []).reduce((acc, group) => {
    const members = (group as any).members;
    acc[group.id] = Array.isArray(members) ? members.length : 0;
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
 * Fetch group members (from groups.members JSONB)
 */
export async function fetchGroupMembers(groupId: string) {
  const { data: group, error } = await supabase
    .from('groups')
    .select('members')
    .eq('id', groupId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch group members: ${error.message}`);
  }

  // Extract members from JSONB array and fetch member details
  const membersArray = (group?.members as any[]) || [];
  const memberIds = membersArray.map((m: any) => m.member_id).filter(Boolean);

  if (memberIds.length === 0) {
    return membersArray.map((m: any) => ({
      id: m.member_id || '',
      member_id: m.member_id,
      role: m.role,
      status: m.status,
      joined_date: m.joined_date,
      created_at: m.created_at,
      members: null,
    }));
  }

  // Fetch member names
  const { data: membersData } = await supabase
    .from('members')
    .select('id, full_name')
    .in('id', memberIds);

  const membersMap = new Map((membersData || []).map(m => [m.id, m.full_name]));

  return membersArray.map((m: any) => ({
    id: m.member_id || '',
    member_id: m.member_id,
    role: m.role,
    status: m.status,
    joined_date: m.joined_date,
    created_at: m.created_at,
    members: m.member_id ? { full_name: membersMap.get(m.member_id) || null } : null,
  })) as Array<SupabaseGroupMember & { members?: { full_name?: string | null } }>;
}

/**
 * Fetch group meetings (deprecated - meetings table deleted)
 * Returns empty array as meetings are no longer tracked
 */
export async function fetchGroupMeetings(groupId: string) {
  // Meetings table has been deleted - return empty array
  return [] as SupabaseMeeting[];
}

/**
 * Fetch group contributions (from transactions table)
 */
export async function fetchGroupContributions(groupId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('group_id', groupId)
    .eq('type', 'CONTRIBUTION')
    .order('occurred_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch group contributions: ${error.message}`);
  }

  // Map transactions to contribution format for compatibility
  return (data || []).map(tx => ({
    id: tx.id,
    institution_id: tx.institution_id,
    group_id: tx.group_id,
    member_id: tx.member_id,
    date: tx.occurred_at || tx.created_at,
    amount: tx.amount,
    method: tx.channel,
    reference: tx.reference || tx.momo_ref,
    status: tx.allocation_status === 'allocated' ? 'RECONCILED' : 'RECORDED',
    created_at: tx.created_at,
  })) as SupabaseContribution[];
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
