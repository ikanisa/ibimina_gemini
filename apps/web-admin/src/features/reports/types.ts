/**
 * Types for Reports module components
 */

export type ReportScope = 'institution' | 'group' | 'member';
export type StatusFilter = 'all' | 'allocated' | 'unallocated' | 'error' | 'duplicate';

export interface ReportSummary {
  kpis: Record<string, number | string | null>;
  breakdown: Array<{
    group_id?: string;
    member_id?: string;
    group_name?: string;
    group_code?: string;
    member_name?: string;
    member_code?: string;
    transaction_count: number;
    total_received?: number;
    total_contributed?: number;
    allocated_amount?: number;
    unallocated_count?: number;
  }>;
}

export interface LedgerRow {
  id: string;
  occurred_at: string;
  amount: number;
  currency?: string;
  allocation_status: string;
  momo_ref?: string;
  payer_phone?: string;
  payer_name?: string;
  member_name?: string;
  member_code?: string;
  group_name?: string;
  group_code?: string;
}

export interface GroupOption {
  id: string;
  group_name: string;
  group_code?: string;
}

export interface MemberOption {
  id: string;
  full_name: string;
  member_code?: string;
  phone?: string;
}
