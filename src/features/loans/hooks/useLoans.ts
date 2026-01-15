/**
 * useLoans Hook
 * Data fetching hook for loans
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/core/auth';
import { fetchLoans, LoansApiResponse } from '../services/loansService';
import type { Loan, LoanStats } from '../types';

interface UseLoansOptions {
    autoFetch?: boolean;
}

interface UseLoansReturn {
    loans: Loan[];
    stats: LoanStats;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useLoans(options: UseLoansOptions = {}): UseLoansReturn {
    const { autoFetch = true } = options;
    const { institutionId } = useAuth();

    const [loans, setLoans] = useState<Loan[]>([]);
    const [stats, setStats] = useState<LoanStats>({
        totalLoans: 0,
        activeLoans: 0,
        totalDisbursed: 0,
        totalOutstanding: 0,
        totalExpectedInterest: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadLoans = useCallback(async () => {
        if (!institutionId) {
            setLoans([]);
            return;
        }

        setLoading(true);
        setError(null);

        const result: LoansApiResponse = await fetchLoans(institutionId);

        if (result.error) {
            setError(result.error);
        } else {
            setLoans(result.loans);
            setStats(result.stats);
        }

        setLoading(false);
    }, [institutionId]);

    useEffect(() => {
        if (autoFetch) {
            loadLoans();
        }
    }, [autoFetch, loadLoans]);

    return {
        loans,
        stats,
        loading,
        error,
        refetch: loadLoans,
    };
}
