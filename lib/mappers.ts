import type {
  GroupMember,
  LoanStatus,
  TransactionStatus,
  KycStatus,
  StaffMember,
  StaffRole,
  Status,
  Transaction
} from '../types';

export const mapLoanStatus = (status: string): LoanStatus => {
  switch (status) {
    case 'PENDING_APPROVAL':
      return 'Pending Approval';
    case 'ACTIVE':
      return 'Active';
    case 'OVERDUE':
      return 'Overdue';
    case 'CLOSED':
      return 'Closed';
    case 'REJECTED':
      return 'Rejected';
    default:
      return 'Pending Approval';
  }
};

export const mapTransactionStatus = (status: string): TransactionStatus => {
  switch (status) {
    case 'COMPLETED':
      return 'Completed';
    case 'PENDING':
      return 'Pending';
    case 'FAILED':
      return 'Failed';
    case 'REVERSED':
      return 'Reversed';
    default:
      return 'Pending';
  }
};

export const mapTransactionType = (value?: string | null): Transaction['type'] => {
  switch (value) {
    case 'Deposit':
    case 'Withdrawal':
    case 'Loan Repayment':
    case 'Loan Disbursement':
    case 'Token Purchase':
    case 'Token Redeem':
    case 'Group Contribution':
      return value;
    default:
      return 'Deposit';
  }
};

export const mapKycStatus = (status?: string | null): KycStatus => {
  switch (status) {
    case 'VERIFIED':
      return 'Verified';
    case 'REJECTED':
      return 'Rejected';
    case 'PENDING':
    default:
      return 'Pending';
  }
};

export const mapMemberStatus = (status?: string | null): Status => {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'SUSPENDED':
      return 'Suspended';
    case 'CLOSED':
      return 'Closed';
    case 'PENDING':
    default:
      return 'Pending';
  }
};

export const mapGroupMemberRole = (role?: string | null): GroupMember['role'] => {
  switch (role) {
    case 'CHAIRPERSON':
      return 'Chairperson';
    case 'SECRETARY':
      return 'Secretary';
    case 'TREASURER':
      return 'Treasurer';
    case 'MEMBER':
    default:
      return 'Member';
  }
};

export const mapGroupMemberStatus = (status?: string | null): GroupMember['status'] => {
  switch (status) {
    case 'GOOD_STANDING':
      return 'Good Standing';
    case 'IN_ARREARS':
      return 'In Arrears';
    case 'DEFAULTED':
      return 'Defaulted';
    default:
      return 'Good Standing';
  }
};

export const mapStaffStatus = (status?: string | null): StaffMember['status'] => {
  return status === 'SUSPENDED' ? 'Suspended' : 'Active';
};

export const mapStaffRole = (role?: string | null): StaffRole => {
  switch (role) {
    case 'PLATFORM_ADMIN':
      return 'Super Admin';
    case 'INSTITUTION_ADMIN':
      return 'Branch Manager';
    case 'INSTITUTION_TREASURER':
      return 'Teller';
    case 'INSTITUTION_AUDITOR':
      return 'Auditor';
    case 'INSTITUTION_STAFF':
    default:
      return 'Loan Officer';
  }
};
