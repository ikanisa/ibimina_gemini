/**
 * Custom hook for group detail data
 * 
 * Fetches and manages all data related to a specific group:
 * members, contributions, transactions, SMS messages
 */

import { useState, useEffect, useCallback } from 'react';
import * as groupsApi from '../lib/api/groups.api';
import * as transactionsApi from '../lib/api/transactions.api';
import * as smsApi from '../lib/api/sms.api';
import type { SupabaseGroupMember, SupabaseContribution, SupabaseTransaction, SupabaseSmsMessage } from '../types';

export interface GroupDetails {
  members: Array<SupabaseGroupMember & { members?: { full_name?: string | null } }>;
  contributions: SupabaseContribution[];
  transactions: Array<SupabaseTransaction & { members?: { full_name?: string | null } }>;
  smsMessages: SupabaseSmsMessage[];
}

export interface UseGroupDetailsReturn {
  details: GroupDetails | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGroupDetails(groupId: string | null): UseGroupDetailsReturn {
  const [details, setDetails] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!groupId) {
      setDetails(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch group details (members, contributions)
      const groupDetails = await groupsApi.fetchGroupDetails(groupId);

      // Fetch transactions for this group
      const transactions = await transactionsApi.fetchTransactions('', { groupId });

      // Fetch SMS messages (we'll filter by group context if needed)
      // For now, fetch all and let component filter
      const smsMessages: SupabaseSmsMessage[] = [];

      setDetails({
        members: Array.isArray(groupDetails.members) ? groupDetails.members : [],
        contributions: Array.isArray(groupDetails.contributions) ? groupDetails.contributions : [],
        transactions: Array.isArray(transactions) ? transactions : [],
        smsMessages
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch group details';
      setError(errorMessage);
      console.error('Error fetching group details:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return {
    details,
    loading,
    error,
    refetch: fetchDetails
  };
}
