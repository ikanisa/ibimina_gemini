/**
 * useTransactions Hook Tests
 * Tests for the transaction data management hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';

// Mock the API module
vi.mock('../../lib/api/transactions.api', () => ({
    fetchTransactions: vi.fn(),
    createTransaction: vi.fn(),
    updateTransactionStatus: vi.fn(),
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
import * as transactionsApi from '../../lib/api/transactions.api';

const mockTransactions = [
    {
        id: 'txn-1',
        institution_id: 'test-institution-id',
        amount: 10000,
        currency: 'RWF',
        transaction_type: 'DEPOSIT',
        transaction_status: 'COMPLETED',
        occurred_at: '2024-01-15T10:00:00Z',
        payer_phone: '+250788123456',
    },
    {
        id: 'txn-2',
        institution_id: 'test-institution-id',
        amount: 5000,
        currency: 'RWF',
        transaction_type: 'WITHDRAWAL',
        transaction_status: 'PENDING',
        occurred_at: '2024-01-15T11:00:00Z',
        payer_phone: '+250789456123',
    },
];

describe('useTransactions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(transactionsApi.fetchTransactions).mockResolvedValue(mockTransactions);
    });

    it('fetches transactions on mount when autoFetch is true', async () => {
        const { result } = renderHook(() => useTransactions());

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(transactionsApi.fetchTransactions).toHaveBeenCalledWith(
            'test-institution-id',
            expect.any(Object)
        );
        expect(result.current.transactions).toEqual(mockTransactions);
    });

    it('does not fetch on mount when autoFetch is false', async () => {
        const { result } = renderHook(() => useTransactions({ autoFetch: false }));

        expect(result.current.loading).toBe(false);
        expect(transactionsApi.fetchTransactions).not.toHaveBeenCalled();
        expect(result.current.transactions).toEqual([]);
    });

    it('handles fetch error gracefully', async () => {
        const error = new Error('Network error');
        vi.mocked(transactionsApi.fetchTransactions).mockRejectedValue(error);

        const { result } = renderHook(() => useTransactions());

        await waitFor(() => {
            expect(result.current.error).toBe('Network error');
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.transactions).toEqual([]);
    });

    it('refetches transactions when refetch is called', async () => {
        const { result } = renderHook(() => useTransactions());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(transactionsApi.fetchTransactions).toHaveBeenCalledTimes(1);

        await act(async () => {
            await result.current.refetch();
        });

        expect(transactionsApi.fetchTransactions).toHaveBeenCalledTimes(2);
    });

    it('passes filter options to the API', async () => {
        const options = {
            memberId: 'member-123',
            groupId: 'group-456',
            status: 'PENDING',
            limit: 50,
        };

        renderHook(() => useTransactions(options));

        await waitFor(() => {
            expect(transactionsApi.fetchTransactions).toHaveBeenCalledWith(
                'test-institution-id',
                {
                    memberId: 'member-123',
                    groupId: 'group-456',
                    status: 'PENDING',
                    limit: 50,
                }
            );
        });
    });

    it('creates transaction and updates state', async () => {
        const newTransaction = {
            id: 'txn-new',
            institution_id: 'test-institution-id',
            amount: 20000,
            currency: 'RWF',
            transaction_type: 'DEPOSIT',
            transaction_status: 'COMPLETED',
            occurred_at: '2024-01-16T10:00:00Z',
        };

        vi.mocked(transactionsApi.createTransaction).mockResolvedValue(newTransaction);

        const { result } = renderHook(() => useTransactions());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.createTransaction({
                institutionId: 'test-institution-id',
                memberId: 'member-123',
                amount: 20000,
                currency: 'RWF',
                type: 'DEPOSIT',
                channel: 'CASH',
                occurredAt: new Date().toISOString(),
            });
        });

        expect(transactionsApi.createTransaction).toHaveBeenCalled();
        expect(result.current.transactions[0]).toEqual(newTransaction);
    });

    it('updates transaction status and updates state', async () => {
        const updatedTransaction = {
            ...mockTransactions[1],
            transaction_status: 'COMPLETED',
        };

        vi.mocked(transactionsApi.updateTransactionStatus).mockResolvedValue(updatedTransaction);

        const { result } = renderHook(() => useTransactions());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.updateTransactionStatus('txn-2', 'COMPLETED');
        });

        expect(transactionsApi.updateTransactionStatus).toHaveBeenCalledWith('txn-2', 'COMPLETED');

        const updated = result.current.transactions.find(t => t.id === 'txn-2');
        expect(updated?.transaction_status).toBe('COMPLETED');
    });

    it('handles create transaction error', async () => {
        const error = new Error('Create failed');
        vi.mocked(transactionsApi.createTransaction).mockRejectedValue(error);

        const { result } = renderHook(() => useTransactions());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            try {
                await result.current.createTransaction({
                    institutionId: 'test-institution-id',
                    memberId: 'member-123',
                    amount: 20000,
                    currency: 'RWF',
                    type: 'DEPOSIT',
                    channel: 'CASH',
                    occurredAt: new Date().toISOString(),
                });
            } catch {
                // Expected error
            }
        });

        expect(result.current.error).toBe('Create failed');
    });
});
