/**
 * Mappers Unit Tests
 * Tests for data transformation functions
 */

import { describe, it, expect } from 'vitest';
import {
    mapLoanStatus,
    mapTransactionStatus,
    mapTransactionType,
    mapTransactionChannel,
    mapKycStatus,
    mapMemberStatus,
    mapGroupMemberRole,
    mapGroupMemberStatus,
    mapStaffStatus,
    mapStaffRole,
} from '../mappers';

describe('mapLoanStatus', () => {
    it('maps PENDING_APPROVAL correctly', () => {
        expect(mapLoanStatus('PENDING_APPROVAL')).toBe('Pending Approval');
    });

    it('maps ACTIVE correctly', () => {
        expect(mapLoanStatus('ACTIVE')).toBe('Active');
    });

    it('maps OVERDUE correctly', () => {
        expect(mapLoanStatus('OVERDUE')).toBe('Overdue');
    });

    it('maps CLOSED correctly', () => {
        expect(mapLoanStatus('CLOSED')).toBe('Closed');
    });

    it('maps REJECTED correctly', () => {
        expect(mapLoanStatus('REJECTED')).toBe('Rejected');
    });

    it('returns default for unknown status', () => {
        expect(mapLoanStatus('UNKNOWN')).toBe('Pending Approval');
    });
});

describe('mapTransactionStatus', () => {
    it('maps COMPLETED correctly', () => {
        expect(mapTransactionStatus('COMPLETED')).toBe('Completed');
    });

    it('maps PENDING correctly', () => {
        expect(mapTransactionStatus('PENDING')).toBe('Pending');
    });

    it('maps FAILED correctly', () => {
        expect(mapTransactionStatus('FAILED')).toBe('Failed');
    });

    it('maps REVERSED correctly', () => {
        expect(mapTransactionStatus('REVERSED')).toBe('Reversed');
    });

    it('returns default for unknown status', () => {
        expect(mapTransactionStatus('UNKNOWN')).toBe('Pending');
    });
});

describe('mapTransactionType', () => {
    it('maps Deposit variations correctly', () => {
        expect(mapTransactionType('Deposit')).toBe('Deposit');
        expect(mapTransactionType('DEPOSIT')).toBe('Deposit');
    });

    it('maps Withdrawal variations correctly', () => {
        expect(mapTransactionType('Withdrawal')).toBe('Withdrawal');
        expect(mapTransactionType('WITHDRAWAL')).toBe('Withdrawal');
    });

    it('maps Loan Repayment variations correctly', () => {
        expect(mapTransactionType('Loan Repayment')).toBe('Loan Repayment');
        expect(mapTransactionType('LOAN_REPAYMENT')).toBe('Loan Repayment');
    });

    it('maps CONTRIBUTION to Group Contribution', () => {
        expect(mapTransactionType('CONTRIBUTION')).toBe('Group Contribution');
    });

    it('handles null and undefined', () => {
        expect(mapTransactionType(null)).toBe('Deposit');
        expect(mapTransactionType(undefined)).toBe('Deposit');
    });
});

describe('mapTransactionChannel', () => {
    it('maps Cash variations correctly', () => {
        expect(mapTransactionChannel('Cash')).toBe('Cash');
        expect(mapTransactionChannel('CASH')).toBe('Cash');
    });

    it('maps MoMo variations correctly', () => {
        expect(mapTransactionChannel('MoMo')).toBe('MoMo USSD');
        expect(mapTransactionChannel('MOMO')).toBe('MoMo USSD');
    });

    it('maps NFC correctly', () => {
        expect(mapTransactionChannel('MoMo NFC')).toBe('MoMo NFC');
        expect(mapTransactionChannel('NFC')).toBe('MoMo NFC');
    });

    it('handles null and undefined', () => {
        expect(mapTransactionChannel(null)).toBe('MoMo USSD');
        expect(mapTransactionChannel(undefined)).toBe('MoMo USSD');
    });
});

describe('mapKycStatus', () => {
    it('maps VERIFIED correctly', () => {
        expect(mapKycStatus('VERIFIED')).toBe('Verified');
    });

    it('maps REJECTED correctly', () => {
        expect(mapKycStatus('REJECTED')).toBe('Rejected');
    });

    it('maps PENDING correctly', () => {
        expect(mapKycStatus('PENDING')).toBe('Pending');
    });

    it('handles null and undefined', () => {
        expect(mapKycStatus(null)).toBe('Pending');
        expect(mapKycStatus(undefined)).toBe('Pending');
    });
});

describe('mapMemberStatus', () => {
    it('maps ACTIVE correctly', () => {
        expect(mapMemberStatus('ACTIVE')).toBe('Active');
    });

    it('maps SUSPENDED correctly', () => {
        expect(mapMemberStatus('SUSPENDED')).toBe('Suspended');
    });

    it('maps CLOSED correctly', () => {
        expect(mapMemberStatus('CLOSED')).toBe('Closed');
    });

    it('handles null and undefined', () => {
        expect(mapMemberStatus(null)).toBe('Pending');
        expect(mapMemberStatus(undefined)).toBe('Pending');
    });
});

describe('mapGroupMemberRole', () => {
    it('maps CHAIRPERSON correctly', () => {
        expect(mapGroupMemberRole('CHAIRPERSON')).toBe('Chairperson');
    });

    it('maps SECRETARY correctly', () => {
        expect(mapGroupMemberRole('SECRETARY')).toBe('Secretary');
    });

    it('maps TREASURER correctly', () => {
        expect(mapGroupMemberRole('TREASURER')).toBe('Treasurer');
    });

    it('maps MEMBER correctly', () => {
        expect(mapGroupMemberRole('MEMBER')).toBe('Member');
    });

    it('handles null and undefined', () => {
        expect(mapGroupMemberRole(null)).toBe('Member');
        expect(mapGroupMemberRole(undefined)).toBe('Member');
    });
});

describe('mapGroupMemberStatus', () => {
    it('maps GOOD_STANDING correctly', () => {
        expect(mapGroupMemberStatus('GOOD_STANDING')).toBe('Good Standing');
    });

    it('maps IN_ARREARS correctly', () => {
        expect(mapGroupMemberStatus('IN_ARREARS')).toBe('In Arrears');
    });

    it('maps DEFAULTED correctly', () => {
        expect(mapGroupMemberStatus('DEFAULTED')).toBe('Defaulted');
    });

    it('handles null and undefined', () => {
        expect(mapGroupMemberStatus(null)).toBe('Good Standing');
        expect(mapGroupMemberStatus(undefined)).toBe('Good Standing');
    });
});

describe('mapStaffStatus', () => {
    it('maps SUSPENDED correctly', () => {
        expect(mapStaffStatus('SUSPENDED')).toBe('Suspended');
    });

    it('returns Active for other statuses', () => {
        expect(mapStaffStatus('ACTIVE')).toBe('Active');
        expect(mapStaffStatus(null)).toBe('Active');
    });
});

describe('mapStaffRole', () => {
    it('maps PLATFORM_ADMIN correctly', () => {
        expect(mapStaffRole('PLATFORM_ADMIN')).toBe('Admin');
    });

    it('maps INSTITUTION_ADMIN correctly', () => {
        expect(mapStaffRole('INSTITUTION_ADMIN')).toBe('Admin');
    });

    it('maps INSTITUTION_TREASURER correctly', () => {
        expect(mapStaffRole('INSTITUTION_TREASURER')).toBe('Staff');
    });

    it('maps INSTITUTION_AUDITOR correctly', () => {
        expect(mapStaffRole('INSTITUTION_AUDITOR')).toBe('Staff');
    });

    it('returns default for unknown role', () => {
        expect(mapStaffRole('UNKNOWN')).toBe('Staff');
        expect(mapStaffRole(null)).toBe('Staff');
    });
});
