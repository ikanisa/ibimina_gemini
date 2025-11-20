
export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  GROUPS = 'GROUPS',
  GROUP_DETAILS = 'GROUP_DETAILS',
  SACCOS = 'SACCOS',
  MEMBERS = 'MEMBERS',
  ACCOUNTS = 'ACCOUNTS',
  LOANS = 'LOANS',
  TRANSACTIONS = 'TRANSACTIONS',
  MOMO_OPERATIONS = 'MOMO_OPERATIONS', // SMS Parsing (Staff)
  NFC_LOGS = 'NFC_LOGS', // NFC Logs (Admin)
  TOKENS = 'TOKENS',
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

export interface NfcLog {
  id: string;
  timestamp: string;
  deviceId: string;
  tagId: string;
  action: string;
  status: 'Success' | 'Failed' | 'Pending SMS';
  memberId?: string;
  amount?: number;
  linkedSms?: boolean;
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
