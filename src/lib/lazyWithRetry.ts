/**
 * Lazy Load with Retry
 * 
 * Provides retry logic for lazy-loaded components to handle network failures.
 * Useful when JavaScript chunks fail to load due to network issues or stale cache.
 */

import React from 'react';

export interface LazyWithRetryOptions {
    /** Number of retry attempts (default: 3) */
    retries?: number;
    /** Delay between retries in ms (default: 1000) */
    delay?: number;
    /** Whether to reload on final failure (default: false) */
    reloadOnFail?: boolean;
}

/**
 * Wrapper around React.lazy that adds retry logic for component loading
 * 
 * @example
 * const Dashboard = lazyWithRetry(() => import('./Dashboard'));
 * 
 * @example
 * const Dashboard = lazyWithRetry(
 *   () => import('./Dashboard'),
 *   { retries: 5, delay: 2000 }
 * );
 */
export function lazyWithRetry<T extends React.ComponentType<unknown>>(
    factory: () => Promise<{ default: T }>,
    options: LazyWithRetryOptions = {}
): React.LazyExoticComponent<T> {
    const { retries = 3, delay = 1000, reloadOnFail = false } = options;

    return React.lazy(async () => {
        let lastError: Error | unknown;

        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                // Attempt to load the component
                const component = await factory();
                return component;
            } catch (error) {
                lastError = error;

                // Log retry attempt
                console.warn(
                    `[LazyLoad] Failed to load component (attempt ${attempt + 1}/${retries}):`,
                    error instanceof Error ? error.message : error
                );

                // If not the last attempt, wait before retrying
                if (attempt < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay));

                    // Try to clear stale cache entries that might be causing issues
                    if ('caches' in window && attempt > 0) {
                        try {
                            const keys = await caches.keys();
                            await Promise.all(
                                keys
                                    .filter(key => key.includes('workbox') || key.includes('precache'))
                                    .map(key => caches.delete(key))
                            );
                        } catch (cacheError) {
                            // Ignore cache clearing errors
                        }
                    }
                }
            }
        }

        // All retries failed
        console.error('[LazyLoad] Component load failed after all retries:', lastError);

        if (reloadOnFail) {
            // Force a full page reload as last resort
            window.location.reload();
        }

        // Re-throw the last error
        throw lastError;
    });
}

/**
 * Check if an error is a chunk load error (dynamic import failure)
 */
export function isChunkLoadError(error: unknown): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return (
            message.includes('loading chunk') ||
            message.includes('loading css chunk') ||
            message.includes('failed to fetch dynamically imported module') ||
            message.includes('importing a module script failed') ||
            error.name === 'ChunkLoadError'
        );
    }
    return false;
}

export default lazyWithRetry;
