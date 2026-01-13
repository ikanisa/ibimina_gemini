/**
 * Offline Sync Utilities
 * Handles syncing queued actions when connection is restored
 */

import { getQueuedActions, removeQueuedAction, updateQueuedAction, QueuedAction } from './queue';
import { supabase } from '../supabase';

const MAX_RETRY_COUNT = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Execute a queued action
 */
async function executeAction(action: QueuedAction): Promise<{ success: boolean; error?: any }> {
  try {
    switch (action.type) {
      case 'create':
        return await executeCreate(action);
      case 'update':
        return await executeUpdate(action);
      case 'delete':
        return await executeDelete(action);
      case 'allocate':
        return await executeAllocate(action);
      case 'bulk':
        return await executeBulk(action);
      default:
        return { success: false, error: 'Unknown action type' };
    }
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Execute create action
 */
async function executeCreate(action: QueuedAction): Promise<{ success: boolean; error?: any }> {
  const { resource, payload } = action;

  try {
    const { error } = await supabase
      .from(resource === 'transaction' ? 'transactions' : `${resource}s`)
      .insert(payload);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Execute update action
 */
async function executeUpdate(action: QueuedAction): Promise<{ success: boolean; error?: any }> {
  const { resource, payload } = action;
  const { id, ...updateData } = payload;

  if (!id) {
    return { success: false, error: 'Missing ID for update' };
  }

  try {
    const { error } = await supabase
      .from(resource === 'transaction' ? 'transactions' : `${resource}s`)
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Execute delete action
 */
async function executeDelete(action: QueuedAction): Promise<{ success: boolean; error?: any }> {
  const { resource, payload } = action;
  const { id } = payload;

  if (!id) {
    return { success: false, error: 'Missing ID for delete' };
  }

  try {
    const { error } = await supabase
      .from(resource === 'transaction' ? 'transactions' : `${resource}s`)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Execute allocate action
 */
async function executeAllocate(action: QueuedAction): Promise<{ success: boolean; error?: any }> {
  const { payload } = action;

  try {
    const { error } = await supabase.rpc('allocate_transaction', {
      p_transaction_id: payload.transaction_id,
      p_member_id: payload.member_id,
      p_note: payload.note || null,
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Execute bulk action
 */
async function executeBulk(action: QueuedAction): Promise<{ success: boolean; error?: any }> {
  const { resource, payload } = action;
  const { ids, operation, data } = payload;

  try {
    switch (operation) {
      case 'update':
        const { error: updateError } = await supabase
          .from(resource === 'transaction' ? 'transactions' : `${resource}s`)
          .update(data)
          .in('id', ids);

        if (updateError) throw updateError;
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from(resource === 'transaction' ? 'transactions' : `${resource}s`)
          .delete()
          .in('id', ids);

        if (deleteError) throw deleteError;
        break;

      default:
        return { success: false, error: 'Unknown bulk operation' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Sync all queued actions
 */
export async function syncOfflineQueue(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  const actions = getQueuedActions();
  let success = 0;
  let failed = 0;

  // Process actions sequentially to avoid conflicts
  for (const action of actions) {
    const result = await executeAction(action);

    if (result.success) {
      removeQueuedAction(action.id);
      success++;
    } else {
      const retryCount = (action.retryCount || 0) + 1;

      if (retryCount >= MAX_RETRY_COUNT) {
        // Remove after max retries
        removeQueuedAction(action.id);
        failed++;
        console.error('Action failed after max retries:', action, result.error);
      } else {
        // Update retry count and delay
        updateQueuedAction(action.id, {
          retryCount,
          timestamp: Date.now() + RETRY_DELAY * retryCount,
        });
        failed++;
      }
    }

    // Small delay between actions
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return {
    success,
    failed,
    total: actions.length,
  };
}

/**
 * Check if sync is needed
 */
export function needsSync(): boolean {
  return getQueuedActions().length > 0;
}
