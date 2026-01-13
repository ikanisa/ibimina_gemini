/**
 * Offline Action Queue
 * Stores actions performed while offline and syncs them when connection is restored
 */

const QUEUE_STORAGE_KEY = 'offline_action_queue';
const MAX_QUEUE_SIZE = 100;

export interface QueuedAction {
  id: string;
  type: 'create' | 'update' | 'delete' | 'allocate' | 'bulk';
  resource: 'transaction' | 'member' | 'group' | 'report';
  payload: Record<string, any>;
  timestamp: number;
  retryCount?: number;
}

/**
 * Get all queued actions from storage
 */
export function getQueuedActions(): QueuedAction[] {
  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to get queued actions:', error);
    return [];
  }
}

/**
 * Save queued actions to storage
 */
function saveQueuedActions(actions: QueuedAction[]): void {
  try {
    // Limit queue size
    const limitedActions = actions.slice(-MAX_QUEUE_SIZE);
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(limitedActions));
  } catch (error) {
    console.error('Failed to save queued actions:', error);
    // Try to clear if storage is full
    if (error instanceof DOMException && error.code === 22) {
      try {
        // Remove oldest entries
        const reduced = actions.slice(-Math.floor(MAX_QUEUE_SIZE / 2));
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(reduced));
      } catch (e) {
        console.error('Failed to reduce queue size:', e);
      }
    }
  }
}

/**
 * Add action to offline queue
 */
export function queueAction(action: Omit<QueuedAction, 'id' | 'timestamp'>): string {
  const id = `${action.type}_${action.resource}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const queuedAction: QueuedAction = {
    ...action,
    id,
    timestamp: Date.now(),
    retryCount: 0,
  };

  const actions = getQueuedActions();
  actions.push(queuedAction);
  saveQueuedActions(actions);

  return id;
}

/**
 * Remove action from queue
 */
export function removeQueuedAction(id: string): void {
  const actions = getQueuedActions();
  const filtered = actions.filter(a => a.id !== id);
  saveQueuedActions(filtered);
}

/**
 * Update retry count for a queued action
 */
export function updateQueuedAction(id: string, updates: Partial<QueuedAction>): void {
  const actions = getQueuedActions();
  const index = actions.findIndex(a => a.id === id);
  if (index !== -1) {
    actions[index] = { ...actions[index], ...updates };
    saveQueuedActions(actions);
  }
}

/**
 * Get queued actions count
 */
export function getQueuedActionsCount(): number {
  return getQueuedActions().length;
}

/**
 * Clear all queued actions
 */
export function clearQueuedActions(): void {
  localStorage.removeItem(QUEUE_STORAGE_KEY);
}

/**
 * Get queued actions for a specific resource
 */
export function getQueuedActionsForResource(resource: QueuedAction['resource']): QueuedAction[] {
  return getQueuedActions().filter(a => a.resource === resource);
}

/**
 * Check if there are pending actions in the queue
 */
export function hasQueuedActions(): boolean {
  return getQueuedActionsCount() > 0;
}
