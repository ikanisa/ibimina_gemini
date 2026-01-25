/**
 * Member Data Transformers
 * 
 * Transforms Supabase member data to UI-friendly formats
 */

import type { SupabaseMember, Member } from '../../types';
import { mapMemberStatus, mapKycStatus } from '../mappers';
import { buildInitialsAvatar } from '../avatars';

/**
 * Transform Supabase member to UI member
 */
export function transformMember(member: SupabaseMember, groups: string[] = []): Member {
  return {
    id: member.id,
    name: member.full_name,
    phone: member.phone,
    branch: member.branch || 'HQ',
    status: mapMemberStatus(member.status),
    kycStatus: mapKycStatus(member.kyc_status),
    savingsBalance: member.savings_balance ?? 0,
    loanBalance: member.loan_balance ?? 0,
    joinDate: member.join_date ?? member.created_at.split('T')[0],
    avatarUrl: member.avatar_url || buildInitialsAvatar(member.full_name),
    groups
  };
}

/**
 * Transform multiple Supabase members to UI members
 */
export function transformMembers(
  members: SupabaseMember[],
  groupsMap?: Map<string, string[]>
): Member[] {
  return members.map(member => {
    const groups = groupsMap?.get(member.id) || [];
    return transformMember(member, groups);
  });
}

