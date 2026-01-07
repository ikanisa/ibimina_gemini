/**
 * Custom hook for member data management with infinite scroll support
 * 
 * Provides a clean interface for components to interact with member data,
 * including loading states, error handling, and CRUD operations.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as membersApi from '../lib/api/members.api';
import type { SupabaseMember } from '../types';
import { useAuth } from '../contexts/AuthContext';

export interface UseMembersOptions {
  includeGroups?: boolean;
  autoFetch?: boolean;
  initialLimit?: number;
  loadMoreLimit?: number;
}

export interface UseMembersReturn {
  members: SupabaseMember[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  createMember: (params: membersApi.CreateMemberParams) => Promise<SupabaseMember>;
  updateMember: (id: string, params: membersApi.UpdateMemberParams) => Promise<SupabaseMember>;
  deleteMember: (id: string) => Promise<void>;
  searchMembers: (searchTerm: string) => Promise<SupabaseMember[]>;
}

const DEFAULT_INITIAL_LIMIT = 50;
const DEFAULT_LOAD_MORE_LIMIT = 25;

export function useMembers(options: UseMembersOptions = {}): UseMembersReturn {
  const { institutionId } = useAuth();
  const { 
    includeGroups = false, 
    autoFetch = true,
    initialLimit = DEFAULT_INITIAL_LIMIT,
    loadMoreLimit = DEFAULT_LOAD_MORE_LIMIT
  } = options;

  const [members, setMembers] = useState<SupabaseMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const loadingRef = useRef(false);

  const fetchMembers = useCallback(async (loadOffset: number = 0, limit: number = initialLimit, append: boolean = false) => {
    if (!institutionId) {
      setMembers([]);
      return;
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = includeGroups
        ? await membersApi.fetchMembersWithGroups(institutionId, { limit, offset: loadOffset })
        : await membersApi.fetchMembers(institutionId, { limit, offset: loadOffset });
      
      if (append) {
        setMembers(prev => [...prev, ...data]);
      } else {
        setMembers(data);
      }
      
      setOffset(loadOffset + data.length);
      setHasMore(data.length === limit);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch members';
      setError(errorMessage);
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [institutionId, includeGroups, initialLimit]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore || loading) return;
    loadingRef.current = true;
    await fetchMembers(offset, loadMoreLimit, true);
  }, [offset, hasMore, loading, fetchMembers, loadMoreLimit]);

  const refetch = useCallback(async () => {
    setOffset(0);
    setHasMore(true);
    await fetchMembers(0, initialLimit, false);
  }, [fetchMembers, initialLimit]);

  useEffect(() => {
    if (autoFetch) {
      fetchMembers(0, initialLimit, false);
    }
  }, [autoFetch, fetchMembers, initialLimit]);

  const createMember = useCallback(async (params: membersApi.CreateMemberParams) => {
    setError(null);
    try {
      const newMember = await membersApi.createMember(params);
      setMembers(prev => [newMember, ...prev]);
      return newMember;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create member';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateMember = useCallback(async (id: string, params: membersApi.UpdateMemberParams) => {
    setError(null);
    try {
      const updated = await membersApi.updateMember(id, params);
      setMembers(prev => prev.map(m => m.id === id ? updated : m));
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update member';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteMember = useCallback(async (id: string) => {
    setError(null);
    try {
      await membersApi.deleteMember(id);
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete member';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const searchMembers = useCallback(async (searchTerm: string) => {
    if (!institutionId) return [];
    
    setError(null);
    try {
      const results = await membersApi.searchMembers(institutionId, searchTerm);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search members';
      setError(errorMessage);
      return [];
    }
  }, [institutionId]);

  return {
    members,
    loading,
    loadingMore,
    error,
    hasMore,
    refetch,
    loadMore,
    createMember,
    updateMember,
    deleteMember,
    searchMembers
  };
}
