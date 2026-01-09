
import { KpiStats, Member, SmsMessage, StaffMember, Transaction, Group, GroupMember, Meeting, Contribution, Loan } from './types';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const MOCK_STATS: KpiStats = USE_MOCK_DATA ? {
  totalMembers: 1240,
  activeMembers: 1150,
  activeGroups: 45,
  totalGroupFunds: 85000000, // RWF
  totalSavings: 450000000, // RWF
  outstandingLoans: 120000000, // RWF
  tokenSupply: 5000, // USD Pegged
  dailyDeposits: 2500000, // RWF
  reconciliationStatus: 'Issues',
} : {
  totalMembers: 0,
  activeMembers: 0,
  activeGroups: 0,
  totalGroupFunds: 0,
  totalSavings: 0,
  outstandingLoans: 0,
  tokenSupply: 0,
  dailyDeposits: 0,
  reconciliationStatus: 'Pending',
};

export const MOCK_GROUPS: Group[] = USE_MOCK_DATA ? [
  {
    id: 'G-101',
    name: "Ibimina y'Urubyiruko",
    code: 'GRP-001',
    saccoId: 'S-001',
    branch: 'Kigali Main',
    status: 'Active',
    cycleLabel: 'Cycle 2023-2024',
    memberCount: 12,
    meetingDay: 'Friday',
    contributionAmount: 5000,
    contributionFrequency: 'Weekly',
    fundBalance: 2400000,
    activeLoansCount: 2,
    nextMeeting: '2023-10-27'
  },
  {
    id: 'G-102',
    name: "Abahuje Vision",
    code: 'GRP-002',
    saccoId: 'S-001',
    branch: 'Musanze Branch',
    status: 'Active',
    cycleLabel: 'Season 5',
    memberCount: 25,
    meetingDay: 'Monday',
    contributionAmount: 10000,
    contributionFrequency: 'Monthly',
    fundBalance: 15600000,
    activeLoansCount: 5,
    nextMeeting: '2023-11-01'
  },
  {
    id: 'G-103',
    name: "Tuzamurane Traders",
    code: 'GRP-003',
    saccoId: 'S-002',
    branch: 'Rubavu',
    status: 'Suspended',
    cycleLabel: 'Cycle 2023',
    memberCount: 8,
    meetingDay: 'Sunday',
    contributionAmount: 2000,
    contributionFrequency: 'Weekly',
    fundBalance: 120000,
    activeLoansCount: 0,
    nextMeeting: 'N/A'
  }
] : [];

export const MOCK_GROUP_MEMBERS: GroupMember[] = USE_MOCK_DATA ? [
  { memberId: 'M-1001', name: 'Jean-Paul Mugenzi', role: 'Chairperson', status: 'Good Standing', joinedDate: '2022-01-01', contributionsPaid: 40, contributionsMissed: 0 },
  { memberId: 'M-1002', name: 'Grace Uwase', role: 'Treasurer', status: 'Good Standing', joinedDate: '2022-02-15', contributionsPaid: 38, contributionsMissed: 2 },
  { memberId: 'M-1004', name: 'Divine Keza', role: 'Member', status: 'In Arrears', joinedDate: '2023-05-01', contributionsPaid: 15, contributionsMissed: 5 },
  { memberId: 'M-1003', name: 'Eric Ndayisaba', role: 'Member', status: 'Good Standing', joinedDate: '2023-01-10', contributionsPaid: 35, contributionsMissed: 0 },
] : [];

export const MOCK_MEETINGS: Meeting[] = USE_MOCK_DATA ? [
  { id: 'MT-501', groupId: 'G-101', date: '2023-10-20', type: 'Regular', attendanceCount: 11, totalCollected: 55000, notes: 'Routine contributions collected.', status: 'Completed' },
  { id: 'MT-502', groupId: 'G-101', date: '2023-10-13', type: 'Loan Approval', attendanceCount: 12, totalCollected: 60000, notes: 'Approved loan for Member M-1002.', status: 'Completed' },
  { id: 'MT-503', groupId: 'G-101', date: '2023-10-27', type: 'Regular', attendanceCount: 0, totalCollected: 0, notes: '', status: 'Scheduled' },
] : [];

export const MOCK_CONTRIBUTIONS: Contribution[] = USE_MOCK_DATA ? [
  // Matrix data for group G-101
  { id: 'C-1', memberId: 'M-1001', groupId: 'G-101', meetingId: 'MT-501', periodLabel: 'Wk 42', expectedAmount: 5000, paidAmount: 5000, status: 'Paid', channel: 'MoMo' },
  { id: 'C-2', memberId: 'M-1002', groupId: 'G-101', meetingId: 'MT-501', periodLabel: 'Wk 42', expectedAmount: 5000, paidAmount: 5000, status: 'Paid', channel: 'Cash' },
  { id: 'C-3', memberId: 'M-1004', groupId: 'G-101', meetingId: 'MT-501', periodLabel: 'Wk 42', expectedAmount: 5000, paidAmount: 0, status: 'Missed', channel: 'Cash' },
  { id: 'C-4', memberId: 'M-1001', groupId: 'G-101', meetingId: 'MT-502', periodLabel: 'Wk 41', expectedAmount: 5000, paidAmount: 5000, status: 'Paid', channel: 'Token' },
] : [];


export const MOCK_MEMBERS: Member[] = USE_MOCK_DATA ? [
  {
    id: 'M-1001',
    name: 'Jean-Paul Mugenzi',
    phone: '+250 788 123 456',
    branch: 'Kigali Main',
    status: 'Active',
    kycStatus: 'Verified',
    savingsBalance: 150000,
    loanBalance: 0,
    tokenBalance: 12.5,
    joinDate: '2023-01-15',
    avatarUrl: 'https://picsum.photos/100/100?random=1',
    groups: ['Ibimina y\'Urubyiruko']
  },
  {
    id: 'M-1002',
    name: 'Grace Uwase',
    phone: '+250 788 654 321',
    branch: 'Musanze Branch',
    status: 'Active',
    kycStatus: 'Verified',
    savingsBalance: 45000,
    loanBalance: 250000,
    tokenBalance: 5.0,
    joinDate: '2023-03-10',
    avatarUrl: 'https://picsum.photos/100/100?random=2',
    groups: ['Abahuje Vision', 'Ibimina y\'Urubyiruko']
  },
  {
    id: 'M-1003',
    name: 'Eric Ndayisaba',
    phone: '+250 789 000 111',
    branch: 'Huye Branch',
    status: 'Pending',
    kycStatus: 'Pending',
    savingsBalance: 5000,
    loanBalance: 0,
    tokenBalance: 0,
    joinDate: '2023-10-05',
    avatarUrl: 'https://picsum.photos/100/100?random=3',
    groups: []
  },
  {
    id: 'M-1004',
    name: 'Divine Keza',
    phone: '+250 783 555 777',
    branch: 'Kigali Main',
    status: 'Active',
    kycStatus: 'Verified',
    savingsBalance: 1200000,
    loanBalance: 0,
    tokenBalance: 150.0,
    joinDate: '2022-11-20',
    avatarUrl: 'https://picsum.photos/100/100?random=4',
    groups: ['Ibimina y\'Urubyiruko']
  },
  {
    id: 'M-1005',
    name: 'Fabrice Iradukunda',
    phone: '+250 788 999 888',
    branch: 'Rubavu',
    status: 'Suspended',
    kycStatus: 'Verified',
    savingsBalance: 10000,
    loanBalance: 50000,
    tokenBalance: 1.0,
    joinDate: '2023-05-01',
    avatarUrl: 'https://picsum.photos/100/100?random=5',
    groups: ['Tuzamurane Traders']
  }
] : [];

export const MOCK_TRANSACTIONS: Transaction[] = USE_MOCK_DATA ? [
  {
    id: 'TX-9001',
    date: '2023-10-26 14:30',
    memberId: 'M-1001',
    memberName: 'Jean-Paul Mugenzi',
    type: 'Group Contribution',
    amount: 5000,
    currency: 'RWF',
    channel: 'MoMo NFC',
    status: 'Completed',
    reference: 'NFC-TAG-8829',
    groupId: 'G-101'
  },
  {
    id: 'TX-9002',
    date: '2023-10-26 13:15',
    memberId: 'M-1002',
    memberName: 'Grace Uwase',
    type: 'Loan Repayment',
    amount: 15000,
    currency: 'RWF',
    channel: 'MoMo USSD',
    status: 'Completed',
    reference: 'USSD-SES-4421'
  },
  {
    id: 'TX-9003',
    date: '2023-10-26 12:00',
    memberId: 'M-1004',
    memberName: 'Divine Keza',
    type: 'Token Purchase',
    amount: 50,
    currency: 'USD',
    channel: 'Token',
    status: 'Completed',
    reference: 'SYS-TOK-112'
  },
  {
    id: 'TX-9004',
    date: '2023-10-26 11:45',
    memberId: 'M-1003',
    memberName: 'Eric Ndayisaba',
    type: 'Deposit',
    amount: 5000,
    currency: 'RWF',
    channel: 'Cash',
    status: 'Pending',
    reference: 'CSH-TELLER-01'
  },
] : [];

export const MOCK_SMS: SmsMessage[] = USE_MOCK_DATA ? [
  {
    id: 'SMS-001',
    sender: 'M-Money',
    timestamp: '2023-10-26 14:29:55',
    body: 'TxId: 8399201. You have received 50,000 RWF from Jean-Paul Mugenzi (0788123456). New Balance: 450,000,000.',
    isParsed: true,
    parsedData: {
      amount: 50000,
      currency: 'RWF',
      transactionId: '8399201',
      counterparty: 'Jean-Paul Mugenzi'
    },
    linkedTransactionId: 'TX-9001'
  },
  {
    id: 'SMS-002',
    sender: 'M-Money',
    timestamp: '2023-10-26 13:14:20',
    body: 'TxId: 8399155. You have received 15,000 RWF from Grace Uwase. Reason: Loan Pay.',
    isParsed: true,
    parsedData: {
      amount: 15000,
      currency: 'RWF',
      transactionId: '8399155',
      counterparty: 'Grace Uwase'
    },
    linkedTransactionId: 'TX-9002'
  },
  {
    id: 'SMS-003',
    sender: 'MTN',
    timestamp: '2023-10-26 10:00:00',
    body: 'Yello! Get 100MB data for only 500 RWF. Dial *154# today.',
    isParsed: false,
  },
  {
    id: 'SMS-004',
    sender: 'M-Money',
    timestamp: '2023-10-26 09:45:10',
    body: 'TxId: 8398800. Confirmed. 20,000 RWF received from unknown number 0788000000.',
    isParsed: true,
    parsedData: {
      amount: 20000,
      currency: 'RWF',
      transactionId: '8398800',
      counterparty: '0788000000'
    },
    // No linked transaction ID implies this needs reconciliation
  }
] : [];



export const MOCK_STAFF: StaffMember[] = USE_MOCK_DATA ? [
  {
    id: 'ST-001',
    name: 'Alice M.',
    email: 'alice.m@saccoplus.rw',
    role: 'Super Admin',
    branch: 'Headquarters',
    status: 'Active',
    lastLogin: 'Just now',
    avatarUrl: 'https://ui-avatars.com/api/?name=Alice+M&background=0D8ABC&color=fff'
  },
  {
    id: 'ST-002',
    name: 'John Doe',
    email: 'john.d@saccoplus.rw',
    role: 'Branch Manager',
    branch: 'Kigali Main',
    status: 'Active',
    lastLogin: '2 hours ago',
    avatarUrl: 'https://ui-avatars.com/api/?name=John+Doe&background=10B981&color=fff'
  },
  {
    id: 'ST-003',
    name: 'Sarah K.',
    email: 'sarah.k@saccoplus.rw',
    role: 'Loan Officer',
    branch: 'Musanze Branch',
    status: 'Active',
    lastLogin: '1 day ago',
    avatarUrl: 'https://ui-avatars.com/api/?name=Sarah+K&background=F59E0B&color=fff'
  },
  {
    id: 'ST-004',
    name: 'Mike R.',
    email: 'mike.r@saccoplus.rw',
    role: 'Teller',
    branch: 'Kigali Main',
    status: 'Suspended',
    lastLogin: '5 days ago',
    avatarUrl: 'https://ui-avatars.com/api/?name=Mike+R&background=EF4444&color=fff'
  },
  {
    id: 'ST-005',
    name: 'David L.',
    email: 'david.l@saccoplus.rw',
    role: 'Auditor',
    branch: 'Headquarters',
    status: 'Active',
    lastLogin: '3 hours ago',
    avatarUrl: 'https://ui-avatars.com/api/?name=David+L&background=6366F1&color=fff'
  }
] : [];

export const MOCK_LOANS: Loan[] = USE_MOCK_DATA ? [
  {
    id: 'L-2201',
    borrowerId: 'M-1002',
    borrowerName: 'Grace Uwase',
    amount: 150000,
    outstandingBalance: 125000,
    status: 'Active',
    startDate: '2023-09-25',
    nextPaymentDate: '2023-10-25',
    groupId: 'G-101',
    interestRate: 1.5,
    termMonths: 6
  },
  {
    id: 'L-2155',
    borrowerId: 'M-1004',
    borrowerName: 'Divine Keza',
    amount: 500000,
    outstandingBalance: 480000,
    status: 'Overdue',
    startDate: '2023-08-10',
    nextPaymentDate: '2023-10-10',
    interestRate: 2.0,
    termMonths: 12
  },
  {
    id: 'L-2210',
    borrowerId: 'M-1001',
    borrowerName: 'Jean-Paul Mugenzi',
    amount: 300000,
    outstandingBalance: 300000,
    status: 'Pending Approval',
    startDate: '2023-10-26',
    interestRate: 1.5,
    termMonths: 6
  }
] : [];
