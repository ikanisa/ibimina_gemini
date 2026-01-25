/**
 * Real-time Updates Hook
 * 
 * Provides real-time subscriptions to Supabase tables using Supabase Realtime
 */

import { useEffect, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { captureError } from '@/lib/sentry';

export interface RealtimeSubscriptionOptions {
  table: string;
  filter?: string; // e.g., 'institution_id=eq.xxx'
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  enabled?: boolean;
}

/**
 * Hook for subscribing to real-time updates from Supabase
 */
export function useRealtime<T = any>(options: RealtimeSubscriptionOptions) {
  const {
    table,
    filter,
    onInsert,
    onUpdate,
    onDelete,
    enabled = true,
  } = options;

  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs for callbacks to avoid re-subscribing when they change
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const onDeleteRef = useRef(onDelete);

  useEffect(() => {
    onInsertRef.current = onInsert;
    onUpdateRef.current = onUpdate;
    onDeleteRef.current = onDelete;
  }, [onInsert, onUpdate, onDelete]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Create channel name
    const channelName = `realtime:${table}${filter ? `:${filter}` : ''}`;

    // Create subscription
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: filter || undefined,
        },
        (payload) => {
          try {
            if (payload.eventType === 'INSERT' && onInsertRef.current) {
              onInsertRef.current(payload.new as T);
            } else if (payload.eventType === 'UPDATE' && onUpdateRef.current) {
              onUpdateRef.current(payload.new as T);
            } else if (payload.eventType === 'DELETE' && onDeleteRef.current) {
              onDeleteRef.current(payload.old as T);
            }
          } catch (err) {
            console.error('Error handling realtime event:', err);
            captureError(err, {
              component: 'useRealtime',
              table,
              eventType: payload.eventType,
            });
            setError(err instanceof Error ? err.message : 'Unknown error');
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'CHANNEL_ERROR') {
          setError('Failed to subscribe to real-time updates');
        } else if (status === 'TIMED_OUT') {
          setError('Real-time subscription timed out');
        } else {
          setError(null);
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
    };
  }, [table, filter, enabled]);

  return {
    isConnected,
    error,
    channel: channelRef.current, // eslint-disable-line react-hooks/refs
  };
}

/**
 * Hook for real-time transaction updates
 */
export function useRealtimeTransactions(options: {
  institutionId?: string;
  onInsert?: (transaction: any) => void;
  onUpdate?: (transaction: any) => void;
  onDelete?: (transaction: any) => void;
  enabled?: boolean;
}) {
  const { institutionId, onInsert, onUpdate, onDelete, enabled = true } = options;

  const filter = institutionId ? `institution_id=eq.${institutionId}` : undefined;

  return useRealtime({
    table: 'transactions',
    filter,
    onInsert,
    onUpdate,
    onDelete,
    enabled,
  });
}

/**
 * Hook for real-time member updates
 */
export function useRealtimeMembers(options: {
  institutionId?: string;
  onInsert?: (member: any) => void;
  onUpdate?: (member: any) => void;
  onDelete?: (member: any) => void;
  enabled?: boolean;
}) {
  const { institutionId, onInsert, onUpdate, onDelete, enabled = true } = options;

  const filter = institutionId ? `institution_id=eq.${institutionId}` : undefined;

  return useRealtime({
    table: 'members',
    filter,
    onInsert,
    onUpdate,
    onDelete,
    enabled,
  });
}

/**
 * Hook for real-time group updates
 */
export function useRealtimeGroups(options: {
  institutionId?: string;
  onInsert?: (group: any) => void;
  onUpdate?: (group: any) => void;
  onDelete?: (group: any) => void;
  enabled?: boolean;
}) {
  const { institutionId, onInsert, onUpdate, onDelete, enabled = true } = options;

  const filter = institutionId ? `institution_id=eq.${institutionId}` : undefined;

  return useRealtime({
    table: 'groups',
    filter,
    onInsert,
    onUpdate,
    onDelete,
    enabled,
  });
}
