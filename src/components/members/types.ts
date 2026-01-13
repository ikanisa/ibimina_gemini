/**
 * Types for Members module components
 */

import { Member, ViewState } from '../../types';

export interface MembersListProps {
  members: Member[];
  onSelectMember: (member: Member) => void;
  searchTerm?: string;
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export interface MemberDetailProps {
  member: Member;
  onClose: () => void;
  onNavigate?: (view: ViewState) => void;
}

export interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  institutionId: string;
  createMember: (data: {
    institution_id: string;
    full_name: string;
    phone: string;
    branch: string;
  }) => Promise<void>;
}
