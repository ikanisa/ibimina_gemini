/**
 * Centralized API Service Layer
 * 
 * This module exports all API services for consistent data access
 * across the application. All Supabase queries should go through
 * these services for better maintainability and testability.
 */

// Export PaginationOptions from members.api only to avoid duplicate
export type { PaginationOptions } from './members.api';

// Re-export specific items from each module (excluding duplicates)
export {
    fetchMembers,
    fetchMembersWithGroups,
    fetchMemberById,
    createMember,
    updateMember,
    deleteMember,
    addMemberToGroup,
    removeMemberFromGroup,
    searchMembers,
    type CreateMemberParams,
    type UpdateMemberParams,
    type MemberWithGroups,
} from './members.api';

export {
    fetchGroups,
    fetchGroupsWithMemberCounts,
    fetchGroupById,
    createGroup,
    updateGroup,
    deleteGroup,
    fetchGroupMembers,
    fetchGroupMeetings,
    fetchGroupContributions,
    fetchGroupDetails,
    searchGroups,
    type CreateGroupParams,
    type UpdateGroupParams,
} from './groups.api';

export * from './transactions.api';
export * from './sms.api';
export * from './staff.api';
export * from './reconciliation.api';
