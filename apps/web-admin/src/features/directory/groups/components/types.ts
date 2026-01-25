/**
 * Types for Groups module components
 */

import { Group, GroupMember, Contribution, Transaction, SmsMessage, ViewState } from '@/core/types';

export type DetailTab = 'Overview' | 'Members' | 'Contributions' | 'Loans' | 'MoMo' | 'Settings';

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
