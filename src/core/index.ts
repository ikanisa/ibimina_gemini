/**
 * Core Module - Centralized exports for core application infrastructure
 * 
 * Import from here for:
 * - Types (database and application models)
 * - Configuration (env, supabase client)
 * - Error handling
 * - Authentication
 * 
 * @example
 * import { supabase, env } from '@/core';
 * import { SupabaseTransaction, Member } from '@/core/types';
 * import { handleError } from '@/core/errors';
 * import { useAuth } from '@/core/auth';
 */

// Config exports
export * from './config';

// Type exports
export * from './types';

// Error handling
export * from './errors';

// Auth
export * from './auth';
