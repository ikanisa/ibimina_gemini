/**
 * Members Feature Module
 * 
 * Exports all members-related components, hooks, and services.
 */

// Components
export { default as Members } from './components/Members';
export { MembersList } from './components/MembersList';
export { MemberDetail } from './components/MemberDetail';
export { MemberWizard } from './components/MemberWizard';
export { AddMemberModal } from './components/AddMemberModal';
export { BulkMemberImport } from './components/BulkMemberImport';
export { MembersSkeleton } from './components/MembersSkeleton';
export { VirtualizedMembersList } from './components/VirtualizedMembersList';

// Hooks
export { useMembers } from './hooks/useMembers';
export { useMemberSearch } from './hooks/useMemberSearch';

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
