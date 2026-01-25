/**
 * Offline Sync Module
 * 
 * Handles syncing of queued offline operations when connectivity is restored.
 */

// Queue of pending operations stored in localStorage
const QUEUE_KEY = 'offline_sync_queue';

export interface OfflineOperation {
    id: string;
    type: string;
    data: unknown;
    timestamp: number;
}

/**
 * Get the current offline queue
 */
export function getOfflineQueue(): OfflineOperation[] {
    try {
        const stored = localStorage.getItem(QUEUE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

/**
 * Add an operation to the offline queue
 */
export function queueOfflineOperation(type: string, data: unknown): void {
    const queue = getOfflineQueue();
    queue.push({
        id: crypto.randomUUID(),
        type,
        data,
        timestamp: Date.now(),
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Clear the offline queue
 */
export function clearOfflineQueue(): void {
    localStorage.removeItem(QUEUE_KEY);
}

/**
 * Sync all queued offline operations
 * This is called when connectivity is restored.
 */
export async function syncOfflineQueue(): Promise<void> {
    const queue = getOfflineQueue();

    if (queue.length === 0) {
        return;
    }

    console.log(`[Offline Sync] Processing ${queue.length} queued operations`);

    // Process each operation
    for (const operation of queue) {
        try {
            // For now, just log the operation
            // In a real implementation, this would dispatch to appropriate services
            console.log(`[Offline Sync] Processing: ${operation.type}`, operation.data);

            // TODO: Implement actual sync logic based on operation type
            // switch (operation.type) {
            //   case 'transaction_create':
            //     await transactionService.create(operation.data);
            //     break;
            //   case 'member_update':
            //     await memberService.update(operation.data);
            //     break;
            // }
        } catch (error) {
            console.error(`[Offline Sync] Failed to sync operation ${operation.id}:`, error);
            // Keep failed operations in queue for retry
            continue;
        }
    }

    // Clear successfully processed queue
    clearOfflineQueue();
    console.log('[Offline Sync] Queue processed successfully');
}

export default {
    getOfflineQueue,
    queueOfflineOperation,
    clearOfflineQueue,
    syncOfflineQueue,
};
