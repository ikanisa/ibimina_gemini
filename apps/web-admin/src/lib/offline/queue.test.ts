/**
 * Offline Queue Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  queueAction,
  getQueuedActions,
  removeQueuedAction,
  updateQueuedAction,
  getQueuedActionsCount,
  clearQueuedActions,
  getQueuedActionsForResource,
  hasQueuedActions,
} from './queue';

describe('Offline Queue', () => {
  let storage: Record<string, string> = {};

  beforeEach(() => {
    storage = {};
    clearQueuedActions();
    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      return storage[key] || null;
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      storage[key] = value;
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
      delete storage[key];
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    storage = {};
  });

  it('should queue an action', () => {
    const id = queueAction({
      type: 'create',
      resource: 'transaction',
      payload: { amount: 100 },
    });
    expect(id).toBeTruthy();
    expect(getQueuedActionsCount()).toBe(1);
  });

  it('should retrieve queued actions', () => {
    queueAction({
      type: 'create',
      resource: 'transaction',
      payload: { amount: 100 },
    });
    const actions = getQueuedActions();
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('create');
    expect(actions[0].resource).toBe('transaction');
  });

  it('should remove queued action', () => {
    const id = queueAction({
      type: 'create',
      resource: 'transaction',
      payload: { amount: 100 },
    });
    removeQueuedAction(id);
    expect(getQueuedActionsCount()).toBe(0);
  });

  it('should update queued action', () => {
    const id = queueAction({
      type: 'create',
      resource: 'transaction',
      payload: { amount: 100 },
    });
    updateQueuedAction(id, { retryCount: 1 });
    const actions = getQueuedActions();
    expect(actions[0].retryCount).toBe(1);
  });

  it('should get queued actions for specific resource', () => {
    queueAction({
      type: 'create',
      resource: 'transaction',
      payload: { amount: 100 },
    });
    queueAction({
      type: 'create',
      resource: 'member',
      payload: { name: 'John' },
    });
    const transactionActions = getQueuedActionsForResource('transaction');
    expect(transactionActions).toHaveLength(1);
    expect(transactionActions[0].resource).toBe('transaction');
  });

  it('should check if there are queued actions', () => {
    expect(hasQueuedActions()).toBe(false);
    queueAction({
      type: 'create',
      resource: 'transaction',
      payload: { amount: 100 },
    });
    expect(hasQueuedActions()).toBe(true);
  });

  it('should clear all queued actions', () => {
    queueAction({
      type: 'create',
      resource: 'transaction',
      payload: { amount: 100 },
    });
    clearQueuedActions();
    expect(getQueuedActionsCount()).toBe(0);
  });
});
