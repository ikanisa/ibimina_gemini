/**
 * Custom hook for SMS message data management
 * 
 * Provides a clean interface for components to interact with SMS message data
 */

import { useState, useEffect, useCallback } from 'react';
import * as smsApi from '../lib/api/sms.api';
import type { SupabaseSmsMessage } from '../types';
import { useAuth } from '../contexts/AuthContext';

export interface UseSmsMessagesOptions {
  isParsed?: boolean;
  limit?: number;
  autoFetch?: boolean;
}

export interface UseSmsMessagesReturn {
  messages: SupabaseSmsMessage[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createMessage: (params: smsApi.CreateSmsParams) => Promise<SupabaseSmsMessage>;
  updateMessage: (id: string, params: smsApi.UpdateSmsParams) => Promise<SupabaseSmsMessage>;
  linkToTransaction: (smsId: string, transactionId: string) => Promise<SupabaseSmsMessage>;
  searchMessages: (searchTerm: string) => Promise<SupabaseSmsMessage[]>;
}

export function useSmsMessages(options: UseSmsMessagesOptions = {}): UseSmsMessagesReturn {
  const { institutionId } = useAuth();
  const { isParsed, limit, autoFetch = true } = options;

  const [messages, setMessages] = useState<SupabaseSmsMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!institutionId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await smsApi.fetchSmsMessages(institutionId, { isParsed, limit });
      setMessages(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch SMS messages';
      setError(errorMessage);
      console.error('Error fetching SMS messages:', err);
    } finally {
      setLoading(false);
    }
  }, [institutionId, isParsed, limit]);

  useEffect(() => {
    if (autoFetch) {
      fetchMessages();
    }
  }, [autoFetch, fetchMessages]);

  const createMessage = useCallback(async (params: smsApi.CreateSmsParams) => {
    setError(null);
    try {
      const newMessage = await smsApi.createSmsMessage(params);
      setMessages(prev => [newMessage, ...prev]);
      return newMessage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create SMS message';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateMessage = useCallback(async (id: string, params: smsApi.UpdateSmsParams) => {
    setError(null);
    try {
      const updated = await smsApi.updateSmsMessage(id, params);
      setMessages(prev => prev.map(m => m.id === id ? updated : m));
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update SMS message';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const linkToTransaction = useCallback(async (smsId: string, transactionId: string) => {
    setError(null);
    try {
      const updated = await smsApi.linkSmsToTransaction(smsId, transactionId);
      setMessages(prev => prev.map(m => m.id === smsId ? updated : m));
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to link SMS to transaction';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const searchMessages = useCallback(async (searchTerm: string) => {
    if (!institutionId) return [];
    
    setError(null);
    try {
      const results = await smsApi.searchSmsMessages(institutionId, searchTerm);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search SMS messages';
      setError(errorMessage);
      return [];
    }
  }, [institutionId]);

  return {
    messages,
    loading,
    error,
    refetch: fetchMessages,
    createMessage,
    updateMessage,
    linkToTransaction,
    searchMessages
  };
}

