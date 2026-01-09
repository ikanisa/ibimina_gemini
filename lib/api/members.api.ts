/**
 * Members API Service
 * 
 * Centralized service for all member-related database operations
 */

import { supabase } from '../supabase';
import type { SupabaseMember, SupabaseGroupMember } from '../../types';

export interface CreateMemberParams {
  institution_id: string;
  full_name: string;
  phone: string;
  branch?: string;
  status?: string;
  kyc_status?: 'VERIFIED' | 'PENDING' | 'REJECTED';
}

export interface UpdateMemberParams {
  full_name?: string;
  phone?: string;
  branch?: string;
  status?: string;
  kyc_status?: 'VERIFIED' | 'PENDING' | 'REJECTED';
  savings_balance?: number;
  loan_balance?: number;
  token_balance?: number;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface MemberWithGroups extends SupabaseMember {
  groups?: Array<{ group_name: string }>;
}

/**
 * Fetch all members for an institution with optional pagination
 */
export async function fetchMembers(institutionId: string, options: PaginationOptions = {}) {
  const { limit, offset = 0 } = options;
  
  let query = supabase
    .from('members')
    .select('*')
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: false });

  if (limit !== undefined) {
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch members: ${error.message}`);
  }

  return data as SupabaseMember[];
}

/**
 * Fetch members with their group memberships with optional pagination
 */
export async function fetchMembersWithGroups(institutionId: string, options: PaginationOptions = {}) {
  const { limit, offset = 0 } = options;
  
  let query = supabase
    .from('members')
    .select('*')
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: false });

  if (limit !== undefined) {
    query = query.range(offset, offset + limit - 1);
  }

  const { data: members, error: membersError } = await query;

  if (membersError) {
    throw new Error(`Failed to fetch members: ${membersError.message}`);
  }

  // Only fetch group memberships for the members we loaded
  const memberIds = (members || []).map(m => m.id);
  
  if (memberIds.length === 0) {
    return [] as MemberWithGroups[];
  }

  const { data: groupMemberships, error: groupsError } = await supabase
    .from('group_members')
    .select('member_id, role, groups(group_name)')
    .in('member_id', memberIds);

  if (groupsError) {
    console.warn('Failed to fetch group memberships:', groupsError);
  }

  // Map group memberships to members with roles
  const groupsByMember = new Map<string, Array<{ name: string; role: string }>>();
  (groupMemberships || []).forEach((gm: any) => {
    const groupName = Array.isArray(gm.groups) 
      ? gm.groups[0]?.group_name 
      : gm.groups?.group_name;
    if (groupName) {
      const current = groupsByMember.get(gm.member_id) || [];
      current.push({ name: groupName, role: gm.role || 'MEMBER' });
      groupsByMember.set(gm.member_id, current);
    }
  });

  return (members || []).map((member) => ({
    ...member,
    groups: groupsByMember.get(member.id) || []
  })) as MemberWithGroups[];
}

/**
 * Fetch a single member by ID
 */
export async function fetchMemberById(memberId: string) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch member: ${error.message}`);
  }

  return data as SupabaseMember;
}

/**
 * Create a new member
 */
export async function createMember(params: CreateMemberParams) {
  const { data, error } = await supabase
    .from('members')
    .insert({
      institution_id: params.institution_id,
      full_name: params.full_name.trim(),
      phone: params.phone.trim(),
      branch: params.branch || 'HQ',
      status: params.status || 'ACTIVE',
      kyc_status: params.kyc_status || 'PENDING'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create member: ${error.message}`);
  }

  return data as SupabaseMember;
}

/**
 * Update an existing member
 */
export async function updateMember(memberId: string, params: UpdateMemberParams) {
  const { data, error } = await supabase
    .from('members')
    .update(params)
    .eq('id', memberId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update member: ${error.message}`);
  }

  return data as SupabaseMember;
}

/**
 * Delete a member (soft delete by setting status)
 */
export async function deleteMember(memberId: string) {
  const { error } = await supabase
    .from('members')
    .update({ status: 'CLOSED' })
    .eq('id', memberId);

  if (error) {
    throw new Error(`Failed to delete member: ${error.message}`);
  }
}

/**
 * Add member to a group
 */
export async function addMemberToGroup(
  institutionId: string,
  groupId: string,
  memberId: string,
  role: 'CHAIRPERSON' | 'SECRETARY' | 'TREASURER' | 'MEMBER' = 'MEMBER'
) {
  const { data, error } = await supabase
    .from('group_members')
    .insert({
      institution_id: institutionId,
      group_id: groupId,
      member_id: memberId,
      role,
      status: 'GOOD_STANDING'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add member to group: ${error.message}`);
  }

  return data as SupabaseGroupMember;
}

/**
 * Remove member from a group
 */
export async function removeMemberFromGroup(groupId: string, memberId: string) {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('member_id', memberId);

  if (error) {
    throw new Error(`Failed to remove member from group: ${error.message}`);
  }
}

/**
 * Search members by name or phone
 */
export async function searchMembers(institutionId: string, searchTerm: string) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('institution_id', institutionId)
    .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Failed to search members: ${error.message}`);
  }

  return data as SupabaseMember[];
}
