/**
 * Groups Feature Module
 * 
 * Exports all groups-related components, hooks, and services.
 */

// Components
export { default as Groups } from './components/Groups';
export { GroupsList } from './components/GroupsList';
export { GroupDetail } from './components/GroupDetail';
export { GroupWizard } from './components/GroupWizard';
export { CreateGroupModal } from './components/CreateGroupModal';
export { BulkGroupImport } from './components/BulkGroupImport';
export { GroupContributionsTab } from './components/GroupContributionsTab';
export { GroupMeetingsTab } from './components/GroupMeetingsTab';
export { GroupMembersTab } from './components/GroupMembersTab';
export { GroupMoMoTab } from './components/GroupMoMoTab';
export { GroupOverviewTab } from './components/GroupOverviewTab';
export { GroupSettingsTab } from './components/GroupSettingsTab';
export { GroupsSkeleton } from './components/GroupsSkeleton';
export { VirtualizedGroupsList } from './components/VirtualizedGroupsList';

// Hooks (legacy)
export { useGroups } from './hooks/useGroups';
export { useGroupDetails } from './hooks/useGroupDetails';

// Hooks (V2 - standardized)
export {
    useGroupsV2,
    useGroupDetail,
    useGroupStats,
    useCreateGroup,
    useUpdateGroup,
    useDeleteGroup,
    groupKeys,
} from './hooks/useGroupsV2';

// Services
export { groupService } from './services/groupService';
export type {
    GroupFilters,
    CreateGroupInput,
    UpdateGroupInput,
    GroupWithMemberCount,
} from './services/groupService';

// Types
export * from './types';
