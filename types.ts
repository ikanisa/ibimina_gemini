// ============================================================================
// SUPABASE AUTH TYPES
// ============================================================================

export type UserRole = 'PLATFORM_ADMIN' | 'INSTITUTION_ADMIN' | 'INSTITUTION_STAFF' | 'INSTITUTION_TREASURER' | 'INSTITUTION_AUDITOR';
export type InstitutionType = 'BANK' | 'MFI' | 'SACCO';
export type GroupStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED';
export type ContributionStatus = 'RECORDED' | 'RECONCILED' | 'FLAGGED';
export type PaymentStatus = 'UNRECONCILED' | 'RECONCILED' | 'FLAGGED';
export type WithdrawalStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED';

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    institutionId?: string;
    role?: UserRole;
  };
}

export interface SupabaseProfile {
  user_id: string;
  institution_id: string | null;
  role: UserRole;
  email?: string | null;
  full_name?: string | null;
  branch?: string | null;
  avatar_url?: string | null;
  status?: 'ACTIVE' | 'SUSPENDED';
  last_login_at?: string | null;
}

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  status: string;
  code?: string | null;
  supervisor?: string | null;
  total_assets?: number | null;
  created_at: string;
}

export interface SupabaseGroup {
  id: string;
  institution_id: string;
  group_name: string;
  status: GroupStatus;
  expected_amount: number;
  frequency: string;
  grace_days: number;
  bank_name?: string;
  account_ref?: string;
  currency: string;
  meeting_day?: string | null;
  cycle_label?: string | null;
  fund_balance?: number | null;
  active_loans_count?: number | null;
  next_meeting_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseMember {
  id: string;
  institution_id: string;
  full_name: string;
  phone: string;
  status: string;
  branch?: string | null;
  kyc_status?: KycStatus;
  savings_balance?: number | null;
  loan_balance?: number | null;
  token_balance?: number | null;
  avatar_url?: string | null;
  join_date?: string | null;
  created_at: string;
}

export interface SupabaseContribution {
  id: string;
  institution_id: string;
  group_id: string;
  member_id: string;
  meeting_id?: string | null;
  date: string;
  amount: number;
  method: string;
  channel?: string | null;
  reference: string;
  status: ContributionStatus;
  created_by: string;
  created_at: string;
}

export interface SupabaseGroupMember {
  id: string;
  institution_id: string;
  group_id: string;
  member_id: string;
  role: 'CHAIRPERSON' | 'SECRETARY' | 'TREASURER' | 'MEMBER';
  status: 'GOOD_STANDING' | 'IN_ARREARS' | 'DEFAULTED';
  joined_date?: string | null;
  created_at: string;
}

export interface SupabaseMeeting {
  id: string;
  institution_id: string;
  group_id: string;
  date: string;
  type: string;
  attendance_count: number;
  total_collected: number;
  notes?: string | null;
  status: 'SCHEDULED' | 'COMPLETED';
  created_at: string;
}

export interface IncomingPayment {
  id: string;
  institution_id: string;
  received_date: string;
  amount: number;
  payer_ref: string;
  reference: string;
  raw_text?: string;
  status: PaymentStatus;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  institution_id: string;
  group_id: string;
  member_id?: string;
  request_date: string;
  amount: number;
  status: WithdrawalStatus;
  payment_reference?: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface SupabaseTransaction {
  id: string;
  institution_id: string;
  member_id?: string | null;
  group_id?: string | null;
  type: string;
  amount: number;
  currency: string;
  channel: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED';
  reference?: string | null;
  created_at: string;
}

export interface SupabaseLoan {
  id: string;
  institution_id: string;
  member_id?: string | null;
  group_id?: string | null;
  amount: number;
  outstanding_balance: number;
  status: 'PENDING_APPROVAL' | 'ACTIVE' | 'OVERDUE' | 'CLOSED' | 'REJECTED';
  start_date: string;
  next_payment_date?: string | null;
  interest_rate: number;
  term_months: number;
  created_at: string;
}

export interface SupabaseBranch {
  id: string;
  institution_id: string;
  name: string;
  manager_name?: string | null;
  manager_phone?: string | null;
  status: string;
  created_at: string;
}

export interface SupabaseSmsMessage {
  id: string;
  institution_id: string;
  sender: string;
  timestamp: string;
  body: string;
  is_parsed: boolean;
  parsed_amount?: number | null;
  parsed_currency?: string | null;
  parsed_transaction_id?: string | null;
  parsed_counterparty?: string | null;
  linked_transaction_id?: string | null;
  created_at: string;
}



export interface SupabaseReconciliationIssue {
  id: string;
  institution_id: string;
  source: string;
  amount: number;
  source_reference?: string | null;
  ledger_status: string;
  status: 'OPEN' | 'RESOLVED' | 'IGNORED';
  detected_at: string;
  resolved_at?: string | null;
  notes?: string | null;
  linked_transaction_id?: string | null;
}

export interface SupabaseSettings {
  institution_id: string;
  system_name: string;
  support_email?: string | null;
  base_currency: string;
  momo_shortcode?: string | null;
  momo_merchant_id?: string | null;
  auto_reconcile: boolean;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// EXISTING APPLICATION TYPES
// ============================================================================

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  GROUPS = 'GROUPS',
  GROUP_DETAILS = 'GROUP_DETAILS',
  SACCOS = 'SACCOS',
  MEMBERS = 'MEMBERS',
  ACCOUNTS = 'ACCOUNTS',
  LOANS = 'LOANS',
  TRANSACTIONS = 'TRANSACTIONS',
  MOMO_OPERATIONS = 'MOMO_OPERATIONS',
  PAYMENTS = 'PAYMENTS',
  RECONCILIATION = 'RECONCILIATION',
  STAFF = 'STAFF',
  SETTINGS = 'SETTINGS',
  PROFILE = 'PROFILE',
}

export type Status = 'Active' | 'Pending' | 'Suspended' | 'Closed';
export type TransactionStatus = 'Completed' | 'Pending' | 'Failed' | 'Reversed';
export type KycStatus = 'Verified' | 'Pending' | 'Rejected';
export type StaffRole = 'Super Admin' | 'Branch Manager' | 'Loan Officer' | 'Teller' | 'Auditor';
export type LoanStatus = 'Pending Approval' | 'Active' | 'Overdue' | 'Closed' | 'Rejected';

export interface Group {
  id: string;
  name: string;
  code: string;
  saccoId: string;
  branch: string;
  status: 'Active' | 'Completed' | 'Suspended';
  cycleLabel: string; // e.g. "Cycle 2024"
  memberCount: number;
  meetingDay: string; // e.g. "Tuesday"
  contributionAmount: number;
  contributionFrequency: 'Weekly' | 'Monthly';
  fundBalance: number;
  activeLoansCount: number;
  nextMeeting: string;
}

export interface GroupMember {
  memberId: string;
  name: string;
  role: 'Chairperson' | 'Secretary' | 'Treasurer' | 'Member';
  status: 'Good Standing' | 'In Arrears' | 'Defaulted';
  joinedDate: string;
  contributionsPaid: number;
  contributionsMissed: number;
}

export interface Meeting {
  id: string;
  groupId: string;
  date: string;
  type: 'Regular' | 'Loan Approval' | 'Emergency';
  attendanceCount: number;
  totalCollected: number;
  notes: string;
  status: 'Scheduled' | 'Completed';
}

export interface Contribution {
  id: string;
  memberId: string;
  groupId: string;
  meetingId: string;
  periodLabel: string; // e.g. "Week 1" or "Jan"
  expectedAmount: number;
  paidAmount: number;
  status: 'Paid' | 'Partial' | 'Missed' | 'Excused';
  channel: 'Cash' | 'MoMo' | 'Token';
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  branch: string;
  status: Status;
  kycStatus: KycStatus;
  savingsBalance: number;
  loanBalance: number;
  tokenBalance: number;
  joinDate: string;
  avatarUrl: string;
  groups: string[]; // IDs of groups they belong to
}

export interface Sacco {
  id: string;
  name: string;
  code: string;
  status: Status;
  branchesCount: number;
  membersCount: number;
  totalAssets: number;
  supervisor: string;
}

export interface Transaction {
  id: string;
  date: string;
  memberId: string;
  memberName: string;
  type: 'Deposit' | 'Withdrawal' | 'Loan Repayment' | 'Loan Disbursement' | 'Token Purchase' | 'Token Redeem' | 'Group Contribution';
  amount: number;
  currency: string;
  channel: 'Cash' | 'MoMo NFC' | 'MoMo USSD' | 'Token' | 'System';
  status: TransactionStatus;
  reference: string;
  groupId?: string;
}

export interface SmsMessage {
  id: string;
  sender: string;
  timestamp: string;
  body: string;
  isParsed: boolean;
  parsedData?: {
    amount: number;
    currency: string;
    transactionId: string;
    counterparty: string;
  };
  linkedTransactionId?: string;
}



export interface KpiStats {
  totalMembers: number;
  activeMembers: number;
  activeGroups: number; // New
  totalGroupFunds: number; // New
  totalSavings: number;
  outstandingLoans: number;
  tokenSupply: number;
  dailyDeposits: number;
  reconciliationStatus: 'Balanced' | 'Pending' | 'Issues';
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  branch: string;
  status: 'Active' | 'Suspended';
  lastLogin: string;
  avatarUrl: string;
}

export interface Loan {
  id: string;
  borrowerId: string;
  borrowerName: string;
  amount: number;
  outstandingBalance: number;
  status: LoanStatus;
  startDate: string;
  nextPaymentDate?: string;
  groupId?: string;
  interestRate: number;
  termMonths: number;
}
