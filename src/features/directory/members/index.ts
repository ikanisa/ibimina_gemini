/**
 * Members Feature Module
 * 
 * Exports all members-related components, hooks, and services.
 */

// Components
export { default as Members } from './components/Members';
export { MembersList } from './components/MembersList';
export { MemberDetail } from './components/MemberDetail';
export { default as MemberWizard } from './components/MemberWizard';
export { AddMemberModal } from './components/AddMemberModal';
export { default as BulkMemberImport } from './components/BulkMemberImport';
export { MembersSkeleton } from './components/MembersSkeleton';
export { VirtualizedMembersList } from './components/VirtualizedMembersList';

// Hooks (legacy)
export { useMembers } from './hooks/useMembers';
export { useMemberSearch } from './hooks/useMemberSearch';

// Hooks (V2 - standardized)
export {
    useMembersV2,
    useMemberDetail,
    useMemberSearchV2,
    useMemberBalance,
    useMemberTransactions,
    useCreateMember,
    useUpdateMember,
    memberKeys,
} from './hooks/useMembersV2';

// Services
export { memberService } from './services/memberService';
export type {
    MemberFilters,
    CreateMemberInput,
    UpdateMemberInput,
    MemberWithGroup,
} from './services/memberService';

// Types
export * from './types';
