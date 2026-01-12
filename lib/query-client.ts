/**
 * React Query Client Configuration
 * 
 * Provides centralized configuration for React Query data fetching,
 * caching, and state management.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Cache data for 10 minutes after it becomes unused
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      
      // Retry failed requests up to 3 times
      retry: 3,
      
      // Exponential backoff for retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Don't refetch on window focus (prevents unnecessary requests)
      refetchOnWindowFocus: false,
      
      // Don't refetch on reconnect (we'll handle this manually if needed)
      refetchOnReconnect: false,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
});

/**
 * Query keys factory for consistent key generation
 * Helps avoid typos and ensures consistent key structure
 */
export const queryKeys = {
  // Transactions
  transactions: {
    all: ['transactions'] as const,
    lists: () => [...queryKeys.transactions.all, 'list'] as const,
    list: (filters: {
      institutionId: string;
      memberId?: string;
      groupId?: string;
      status?: string;
      dateRange?: { start: string; end: string };
      searchTerm?: string;
    }) => [...queryKeys.transactions.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.transactions.all, 'detail', id] as const,
  },
  
  // Members
  members: {
    all: ['members'] as const,
    lists: () => [...queryKeys.members.all, 'list'] as const,
    list: (filters: {
      institutionId: string;
      groupId?: string;
      searchTerm?: string;
    }) => [...queryKeys.members.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.members.all, 'detail', id] as const,
  },
  
  // Groups
  groups: {
    all: ['groups'] as const,
    lists: () => [...queryKeys.groups.all, 'list'] as const,
    list: (filters: {
      institutionId: string;
      status?: string;
      searchTerm?: string;
    }) => [...queryKeys.groups.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.groups.all, 'detail', id] as const,
  },
  
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: (institutionId: string) => [...queryKeys.dashboard.all, 'stats', institutionId] as const,
    recentTransactions: (institutionId: string) => [...queryKeys.dashboard.all, 'recent-transactions', institutionId] as const,
  },
  
  // Reports
  reports: {
    all: ['reports'] as const,
    institution: (institutionId: string, dateRange: { start: string; end: string }) => 
      [...queryKeys.reports.all, 'institution', institutionId, dateRange] as const,
    group: (groupId: string, dateRange: { start: string; end: string }) => 
      [...queryKeys.reports.all, 'group', groupId, dateRange] as const,
    member: (memberId: string, dateRange: { start: string; end: string }) => 
      [...queryKeys.reports.all, 'member', memberId, dateRange] as const,
  },
};
