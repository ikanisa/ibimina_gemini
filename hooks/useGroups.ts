/**
 * Custom hook for group data management with infinite scroll support
 * 
 * Provides a clean interface for components to interact with group data,
 * including loading states, error handling, and CRUD operations.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as groupsApi from '../lib/api/groups.api';
import type { SupabaseGroup } from '../types';
import { useAuth } from '../contexts/AuthContext';

export interface UseGroupsOptions {
  includeMemberCounts?: boolean;
  autoFetch?: boolean;
  initialLimit?: number;
  loadMoreLimit?: number;
}

export interface UseGroupsReturn {
  groups: SupabaseGroup[];
  memberCounts: Record<string, number>;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  createGroup: (params: groupsApi.CreateGroupParams) => Promise<SupabaseGroup>;
  updateGroup: (id: string, params: groupsApi.UpdateGroupParams) => Promise<SupabaseGroup>;
  deleteGroup: (id: string) => Promise<void>;
  searchGroups: (searchTerm: string) => Promise<SupabaseGroup[]>;
}

const DEFAULT_INITIAL_LIMIT = 50;
const DEFAULT_LOAD_MORE_LIMIT = 25;

export function useGroups(options: UseGroupsOptions = {}): UseGroupsReturn {
  const { institutionId } = useAuth();
  const { 
    includeMemberCounts = false, 
    autoFetch = true,
    initialLimit = DEFAULT_INITIAL_LIMIT,
    loadMoreLimit = DEFAULT_LOAD_MORE_LIMIT
  } = options;

  const [groups, setGroups] = useState<SupabaseGroup[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const loadingRef = useRef(false);

  const fetchGroups = useCallback(async (loadOffset: number = 0, limit: number = initialLimit, append: boolean = false) => {
    if (!institutionId) {
      setGroups([]);
      setMemberCounts({});
      return;
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      if (includeMemberCounts) {
        const { groups: fetchedGroups, memberCounts: counts } = 
          await groupsApi.fetchGroupsWithMemberCounts(institutionId, { limit, offset: loadOffset });
        
        if (append) {
          setGroups(prev => [...prev, ...fetchedGroups]);
          setMemberCounts(prev => ({ ...prev, ...counts }));
        } else {
          setGroups(fetchedGroups);
          setMemberCounts(counts);
        }
        
        setOffset(loadOffset + fetchedGroups.length);
        setHasMore(fetchedGroups.length === limit);
      } else {
        const fetchedGroups = await groupsApi.fetchGroups(institutionId, { limit, offset: loadOffset });
        
        if (append) {
          setGroups(prev => [...prev, ...fetchedGroups]);
        } else {
          setGroups(fetchedGroups);
        }
        
        setOffset(loadOffset + fetchedGroups.length);
        setHasMore(fetchedGroups.length === limit);
        setMemberCounts({});
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch groups';
      setError(errorMessage);
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [institutionId, includeMemberCounts, initialLimit]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore || loading) return;
    loadingRef.current = true;
    await fetchGroups(offset, loadMoreLimit, true);
  }, [offset, hasMore, loading, fetchGroups, loadMoreLimit]);

  const refetch = useCallback(async () => {
    setOffset(0);
    setHasMore(true);
    await fetchGroups(0, initialLimit, false);
  }, [fetchGroups, initialLimit]);

  useEffect(() => {
    if (autoFetch) {
      fetchGroups(0, initialLimit, false);
    }
  }, [autoFetch, fetchGroups, initialLimit]);

  const createGroup = useCallback(async (params: groupsApi.CreateGroupParams) => {
    setError(null);
    try {
      const newGroup = await groupsApi.createGroup(params);
      setGroups(prev => [newGroup, ...prev]);
      return newGroup;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create group';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateGroup = useCallback(async (id: string, params: groupsApi.UpdateGroupParams) => {
    setError(null);
    try {
      const updated = await groupsApi.updateGroup(id, params);
      setGroups(prev => prev.map(g => g.id === id ? updated : g));
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update group';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteGroup = useCallback(async (id: string) => {
    setError(null);
    try {
      await groupsApi.deleteGroup(id);
      setGroups(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete group';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const searchGroups = useCallback(async (searchTerm: string) => {
    if (!institutionId) return [];
    
    setError(null);
    try {
      const results = await groupsApi.searchGroups(institutionId, searchTerm);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search groups';
      setError(errorMessage);
      return [];
    }
  }, [institutionId]);

  return {
    groups,
    memberCounts,
    loading,
    loadingMore,
    error,
    hasMore,
    refetch,
    loadMore,
    createGroup,
    updateGroup,
    deleteGroup,
    searchGroups
  };
}
