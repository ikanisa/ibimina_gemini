/**
 * Types for Groups module components
 */

import { Group, GroupMember, Meeting, Contribution, Transaction, SmsMessage, ViewState } from '../../types';

export type DetailTab = 'Overview' | 'Members' | 'Contributions' | 'Loans' | 'Meetings' | 'MoMo' | 'Settings';

export interface GroupsListProps {
  groups: Group[];
  onSelectGroup: (group: Group) => void;
  searchTerm?: string;
  loading?: boolean;
}

export interface GroupDetailProps {
  group: Group;
  onBack: () => void;
  onNavigate?: (view: ViewState) => void;
}

export interface GroupTabProps {
  group: Group;
  members?: GroupMember[];
  meetings?: Meeting[];
  contributions?: Contribution[];
  transactions?: Transaction[];
  sms?: SmsMessage[];
  loading?: boolean;
  error?: string | null;
  onNavigate?: (view: ViewState) => void;
}

export interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  institutionId: string;
}
