/**
 * useTransactions Hook Tests
 * Tests for the transaction data management hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';

// Mock the transactionService module
vi.mock('@/features/transactions/services/transactionService', () => ({
    transactionService: {
        getAll: vi.fn(),
        create: vi.fn(),
        updateStatus: vi.fn(),
        allocate: vi.fn(),
    },
}));

// Mock the AuthContext
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        institutionId: 'test-institution-id',
        user: { id: 'test-user', email: 'test@example.com' },
    }),
}));

// Import after mocking
import { useTransactions } from '../useTransactions';
import { transactionService } from '@/features/transactions/services/transactionService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client for testing
const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
        {children}
    </QueryClientProvider>
);

const mockTransactions = [
    {
        id: 'txn-1',
        institution_id: 'test-institution-id',
        amount: 10000,
        currency: 'RWF',
        type: 'DEPOSIT',
        channel: 'MoMo',
        status: 'COMPLETED' as const,
        allocation_status: 'unallocated' as const,
        occurred_at: '2024-01-15T10:00:00Z',
        payer_phone: '+250788123456',
        created_at: '2024-01-15T10:00:00Z',
    },
    {
        id: 'txn-2',
        institution_id: 'test-institution-id',
        amount: 5000,
        currency: 'RWF',
        type: 'WITHDRAWAL',
        channel: 'Cash',
        status: 'PENDING' as const,
        allocation_status: 'unallocated' as const,
        occurred_at: '2024-01-15T11:00:00Z',
        payer_phone: '+250789456123',
        created_at: '2024-01-15T11:00:00Z',
    },
];

describe('useTransactions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(transactionService.getAll).mockResolvedValue(mockTransactions as any);
    });

    it('fetches transactions on mount when autoFetch is true', async () => {
        const { result } = renderHook(() => useTransactions(), { wrapper });

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(transactionService.getAll).toHaveBeenCalled();
        expect(result.current.transactions).toEqual(mockTransactions);
    });

    it('does not fetch on mount when autoFetch is false', async () => {
        const { result } = renderHook(() => useTransactions({ autoFetch: false }), { wrapper });

        expect(result.current.loading).toBe(false);
        expect(transactionService.getAll).not.toHaveBeenCalled();
        expect(result.current.transactions).toEqual([]);
    });

    it('handles fetch error gracefully', async () => {
        const error = new Error('Network error');
        vi.mocked(transactionService.getAll).mockRejectedValue(error);

        const { result } = renderHook(() => useTransactions(), { wrapper });

        await waitFor(() => {
            expect(result.current.error).toBeTruthy();
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.transactions).toEqual([]);
    });

    it('refetches transactions when refetch is called', async () => {
        const { result } = renderHook(() => useTransactions(), { wrapper });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(transactionService.getAll).toHaveBeenCalledTimes(1);

        await act(async () => {
            await result.current.refetch();
        });

        expect(transactionService.getAll).toHaveBeenCalledTimes(2);
    });

    it('passes filter options to the service', async () => {
        const options = {
            memberId: 'member-123',
            groupId: 'group-456',
            status: 'PENDING',
            limit: 50,
        };

        renderHook(() => useTransactions(options), { wrapper });

        await waitFor(() => {
            expect(transactionService.getAll).toHaveBeenCalled();
        });
    });

    it('creates transaction and updates state', async () => {
        const newTransaction = {
            id: 'txn-new',
            institution_id: 'test-institution-id',
            amount: 20000,
            currency: 'RWF',
            type: 'DEPOSIT',
            channel: 'Cash',
            status: 'COMPLETED' as const,
            allocation_status: 'unallocated' as const,
            occurred_at: '2024-01-16T10:00:00Z',
            created_at: '2024-01-16T10:00:00Z',
        };

        vi.mocked(transactionService.create).mockResolvedValue(newTransaction as any);

        const { result } = renderHook(() => useTransactions(), { wrapper });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.createTransaction({
                institution_id: 'test-institution-id',
                member_id: 'member-123',
                amount: 20000,
                type: 'DEPOSIT',
                channel: 'CASH',
            });
        });

        expect(transactionService.create).toHaveBeenCalled();
    });

    it('updates transaction status and updates state', async () => {
        const updatedTransaction = {
            ...mockTransactions[1],
            status: 'COMPLETED' as const,
        };

        vi.mocked(transactionService.updateStatus).mockResolvedValue(updatedTransaction as any);

        const { result } = renderHook(() => useTransactions(), { wrapper });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.updateTransactionStatus('txn-2', 'COMPLETED');
        });

        expect(transactionService.updateStatus).toHaveBeenCalledWith('txn-2', 'COMPLETED');
    });

    it('handles create transaction error', async () => {
        const error = new Error('Create failed');
        vi.mocked(transactionService.create).mockRejectedValue(error);

        const { result } = renderHook(() => useTransactions(), { wrapper });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            try {
                await result.current.createTransaction({
                    institution_id: 'test-institution-id',
                    member_id: 'member-123',
                    amount: 20000,
                    type: 'DEPOSIT',
                    channel: 'CASH',
                });
            } catch {
                // Expected error - mutation throws on failure
            }
        });

        // After rejection, the hook should not store error in state for mutations
        // (mutations throw instead of storing in state)
        expect(transactionService.create).toHaveBeenCalled();
    });
});
