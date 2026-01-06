/**
 * Custom hook for member data management
 * 
 * Provides a clean interface for components to interact with member data,
 * including loading states, error handling, and CRUD operations.
 */

import { useState, useEffect, useCallback } from 'react';
import * as membersApi from '../lib/api/members.api';
import type { SupabaseMember } from '../types';
import { useAuth } from '../contexts/AuthContext';

export interface UseMembersOptions {
  includeGroups?: boolean;
  autoFetch?: boolean;
}

export interface UseMembersReturn {
  members: SupabaseMember[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createMember: (params: membersApi.CreateMemberParams) => Promise<SupabaseMember>;
  updateMember: (id: string, params: membersApi.UpdateMemberParams) => Promise<SupabaseMember>;
  deleteMember: (id: string) => Promise<void>;
  searchMembers: (searchTerm: string) => Promise<SupabaseMember[]>;
}

export function useMembers(options: UseMembersOptions = {}): UseMembersReturn {
  const { institutionId } = useAuth();
  const { includeGroups = false, autoFetch = true } = options;

  const [members, setMembers] = useState<SupabaseMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!institutionId) {
      setMembers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = includeGroups
        ? await membersApi.fetchMembersWithGroups(institutionId)
        : await membersApi.fetchMembers(institutionId);
      setMembers(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch members';
      setError(errorMessage);
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  }, [institutionId, includeGroups]);

  useEffect(() => {
    if (autoFetch) {
      fetchMembers();
    }
  }, [autoFetch, fetchMembers]);

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
    error,
    refetch: fetchMembers,
    createMember,
    updateMember,
    deleteMember,
    searchMembers
  };
}

