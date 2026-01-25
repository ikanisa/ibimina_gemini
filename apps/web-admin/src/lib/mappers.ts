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
    case 'DEPOSIT':
      return 'Deposit';
    case 'Withdrawal':
    case 'WITHDRAWAL':
      return 'Withdrawal';
    case 'Loan Repayment':
    case 'LOAN_REPAYMENT':
      return 'Loan Repayment';
    case 'Loan Disbursement':
    case 'LOAN_DISBURSEMENT':
      return 'Loan Disbursement';
    case 'Group Contribution':
    case 'CONTRIBUTION':
      return 'Group Contribution';
    default:
      return 'Deposit';
  }
};

export const mapTransactionChannel = (channel?: string | null): Transaction['channel'] => {
  switch (channel) {
    case 'Cash':
    case 'CASH':
      return 'Cash';
    case 'MoMo':
    case 'MOMO':
    case 'MoMo USSD':
    case 'MOMO_USSD':
      return 'MoMo USSD';
    case 'Bank':
    case 'BANK':
    case 'BANK_TRANSFER':
      return 'Bank Transfer';
    case 'System':
    case 'SYSTEM':
      return 'System';
    default:
      return 'MoMo USSD';
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
    case 'LEADER':
      return 'Leader';
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
  if (!role) return 'Staff';
  return role.toUpperCase() === 'ADMIN' ? 'Admin' : 'Staff';
};
