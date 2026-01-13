/**
 * Offline Status Hook
 * Detects online/offline status and provides sync capabilities
 */

import { useState, useEffect, useCallback } from 'react';

export interface OfflineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  isSyncing: boolean;
}

/**
 * Hook to detect and manage online/offline status
 */
export function useOffline(): OfflineStatus & {
  sync: () => Promise<void>;
} {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Trigger sync when coming back online
        sync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  const sync = useCallback(async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    try {
      // Import sync function to avoid circular dependencies
      const { syncOfflineQueue } = await import('../lib/offline/sync');
      await syncOfflineQueue();
      setWasOffline(false);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  return {
    isOnline,
    wasOffline,
    isSyncing,
    sync,
  };
}

/**
 * Hook to get online status only (lighter weight)
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
