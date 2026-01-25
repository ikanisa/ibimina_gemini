/**
 * Supabase Client - Backward Compatibility Re-export
 * 
 * This file re-exports the Supabase client from core/config for backward compatibility.
 * New code should import directly from '@/core/config' instead.
 * 
 * @deprecated Import from '@/core/config' or '@/core' instead
 */

export { supabase, isSupabaseConfigured } from '../core/config/supabase';
