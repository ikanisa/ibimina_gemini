/**
 * Custom hook for group data management
 * 
 * Provides a clean interface for components to interact with group data,
 * including loading states, error handling, and CRUD operations.
 */

import { useState, useEffect, useCallback } from 'react';
import * as groupsApi from '../lib/api/groups.api';
import type { SupabaseGroup } from '../types';
import { useAuth } from '../contexts/AuthContext';

export interface UseGroupsOptions {
  includeMemberCounts?: boolean;
  autoFetch?: boolean;
}

export interface UseGroupsReturn {
  groups: SupabaseGroup[];
  memberCounts: Record<string, number>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createGroup: (params: groupsApi.CreateGroupParams) => Promise<SupabaseGroup>;
  updateGroup: (id: string, params: groupsApi.UpdateGroupParams) => Promise<SupabaseGroup>;
  deleteGroup: (id: string) => Promise<void>;
  searchGroups: (searchTerm: string) => Promise<SupabaseGroup[]>;
}

export function useGroups(options: UseGroupsOptions = {}): UseGroupsReturn {
  const { institutionId } = useAuth();
  const { includeMemberCounts = false, autoFetch = true } = options;

  const [groups, setGroups] = useState<SupabaseGroup[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!institutionId) {
      setGroups([]);
      setMemberCounts({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (includeMemberCounts) {
        const { groups: fetchedGroups, memberCounts: counts } = 
          await groupsApi.fetchGroupsWithMemberCounts(institutionId);
        setGroups(fetchedGroups);
        setMemberCounts(counts);
      } else {
        const fetchedGroups = await groupsApi.fetchGroups(institutionId);
        setGroups(fetchedGroups);
        setMemberCounts({});
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch groups';
      setError(errorMessage);
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  }, [institutionId, includeMemberCounts]);

  useEffect(() => {
    if (autoFetch) {
      fetchGroups();
    }
  }, [autoFetch, fetchGroups]);

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
    error,
    refetch: fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    searchGroups
  };
}

