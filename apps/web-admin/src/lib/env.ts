/**
 * Environment Utilities - Backward Compatibility Re-export
 * 
 * This file re-exports env utilities from core/config for backward compatibility.
 * New code should import directly from '@/core/config' instead.
 * 
 * @deprecated Import from '@/core/config' or '@/core' instead
 */

export { requireEnv, getOptionalEnv, env } from '../core/config/env';
