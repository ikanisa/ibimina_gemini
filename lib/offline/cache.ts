/**
 * Offline Data Caching
 * Caches API responses for offline access
 */

const CACHE_PREFIX = 'offline_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData {
  data: any;
  timestamp: number;
  expiresAt: number;
}

/**
 * Get cache key for a resource
 */
function getCacheKey(resource: string, params?: Record<string, any>): string {
  const paramStr = params ? JSON.stringify(params) : '';
  return `${CACHE_PREFIX}${resource}_${paramStr}`;
}

/**
 * Get cached data
 */
export function getCachedData<T>(resource: string, params?: Record<string, any>): T | null {
  try {
    const key = getCacheKey(resource, params);
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const cached: CachedData = JSON.parse(stored);
    const now = Date.now();

    // Check if expired
    if (now > cached.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return cached.data as T;
  } catch (error) {
    console.error('Failed to get cached data:', error);
    return null;
  }
}

/**
 * Set cached data
 */
export function setCachedData<T>(
  resource: string,
  data: T,
  params?: Record<string, any>,
  ttl?: number
): void {
  try {
    const key = getCacheKey(resource, params);
    const now = Date.now();
    const cached: CachedData = {
      data,
      timestamp: now,
      expiresAt: now + (ttl || CACHE_EXPIRY),
    };

    localStorage.setItem(key, JSON.stringify(cached));
  } catch (error) {
    console.error('Failed to set cached data:', error);
    // Try to clear old cache if storage is full
    if (error instanceof DOMException && error.code === 22) {
      clearOldCache();
    }
  }
}

/**
 * Clear cached data for a resource
 */
export function clearCachedData(resource: string, params?: Record<string, any>): void {
  try {
    const key = getCacheKey(resource, params);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear cached data:', error);
  }
}

/**
 * Clear all cached data
 */
export function clearAllCachedData(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Failed to clear all cached data:', error);
  }
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const cached: CachedData = JSON.parse(stored);
            if (now > cached.expiresAt) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // Invalid cache entry, remove it
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('Failed to clear expired cache:', error);
  }
}

/**
 * Clear old cache entries (keep most recent N entries per resource)
 */
function clearOldCache(): void {
  try {
    const MAX_ENTRIES_PER_RESOURCE = 10;
    const resourceGroups: Record<string, Array<{ key: string; timestamp: number }>> = {};

    // Group cache entries by resource
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const cached: CachedData = JSON.parse(stored);
            // Extract resource name (before first _)
            const resourceMatch = key.match(new RegExp(`${CACHE_PREFIX}([^_]+)`));
            if (resourceMatch) {
              const resource = resourceMatch[1];
              if (!resourceGroups[resource]) {
                resourceGroups[resource] = [];
              }
              resourceGroups[resource].push({
                key,
                timestamp: cached.timestamp,
              });
            }
          }
        } catch {
          // Invalid entry, remove it
          localStorage.removeItem(key);
        }
      }
    });

    // Remove oldest entries per resource
    Object.entries(resourceGroups).forEach(([resource, entries]) => {
      if (entries.length > MAX_ENTRIES_PER_RESOURCE) {
        entries.sort((a, b) => a.timestamp - b.timestamp);
        const toRemove = entries.slice(0, entries.length - MAX_ENTRIES_PER_RESOURCE);
        toRemove.forEach(({ key }) => localStorage.removeItem(key));
      }
    });
  } catch (error) {
    console.error('Failed to clear old cache:', error);
  }
}

/**
 * Initialize cache cleanup on app load
 */
if (typeof window !== 'undefined') {
  // Clear expired cache on load
  clearExpiredCache();

  // Clear expired cache every hour
  setInterval(clearExpiredCache, 60 * 60 * 1000);
}
