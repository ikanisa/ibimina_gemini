/**
 * Request deduplication utility
 * Prevents duplicate API calls when multiple components request the same data simultaneously
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

const pendingRequests = new Map<string, PendingRequest<any>>();
const CACHE_TTL = 5000; // 5 seconds - deduplicate requests within this window

/**
 * Deduplicates requests by key. If a request with the same key is already pending,
 * returns the existing promise instead of making a new request.
 * 
 * @param key - Unique key for the request
 * @param requestFn - Function that returns the promise for the request
 * @returns The deduplicated promise
 */
export function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  
  // Clean up old pending requests
  for (const [k, v] of pendingRequests.entries()) {
    if (now - v.timestamp > CACHE_TTL) {
      pendingRequests.delete(k);
    }
  }

  // Check if there's already a pending request
  const existing = pendingRequests.get(key);
  if (existing && (now - existing.timestamp) < CACHE_TTL) {
    return existing.promise;
  }

  // Create new request
  const promise = requestFn().finally(() => {
    // Remove from pending after completion (with a small delay to allow parallel requests to use it)
    setTimeout(() => {
      pendingRequests.delete(key);
    }, 100);
  });

  pendingRequests.set(key, { promise, timestamp: now });
  
  return promise;
}

/**
 * Clears all pending requests (useful for testing or manual cleanup)
 */
export function clearPendingRequests(): void {
  pendingRequests.clear();
}
