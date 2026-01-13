/**
 * Performance API
 * 
 * Client-side utilities for tracking API request performance
 */

import { trackApiRequest } from '../monitoring/apm';

/**
 * Wrapper for Supabase queries to track performance
 */
export async function trackSupabaseQuery<T>(
  queryName: string,
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  const start = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - start;

    trackApiRequest(
      queryName,
      'POST', // Supabase uses POST for queries
      duration,
      result.error ? 500 : 200,
      result.error?.message
    );

    return result;
  } catch (error) {
    const duration = performance.now() - start;

    trackApiRequest(
      queryName,
      'POST',
      duration,
      500,
      error instanceof Error ? error.message : String(error)
    );

    throw error;
  }
}

/**
 * Track React Query query performance
 */
export function trackReactQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  return queryFn()
    .then((data) => {
      const duration = performance.now() - start;
      trackApiRequest(queryKey, 'GET', duration, 200);
      return data;
    })
    .catch((error) => {
      const duration = performance.now() - start;
      trackApiRequest(
        queryKey,
        'GET',
        duration,
        error?.status || 500,
        error?.message
      );
      throw error;
    });
}
