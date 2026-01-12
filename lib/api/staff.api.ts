/**
 * Staff API Service
 * 
 * Centralized service for all staff-related database operations
 */

import { supabase } from '../supabase';
import type { SupabaseProfile } from '../../types';

export interface CreateStaffParams {
  email: string;
  full_name: string;
  role: string;
  branch: string;
  institution_id: string;
  onboarding_method?: 'invite' | 'password';
  password?: string;
}

export interface UpdateStaffParams {
  full_name?: string;
  role?: string;
  branch?: string;
  status?: 'ACTIVE' | 'SUSPENDED';
  avatar_url?: string;
}

/**
 * Fetch all staff for an institution
 */
export async function fetchStaff(institutionId?: string) {
  const key = `fetchStaff:${institutionId || 'all'}`;
  return deduplicateRequest(key, async () => {
    let query = supabase
      .from('profiles')
      .select('user_id, email, role, full_name, branch, avatar_url, status, last_login_at, institution_id');

    if (institutionId) {
      query = query.eq('institution_id', institutionId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch staff: ${error.message}`);
    }

    return data as SupabaseProfile[];
  });
}

/**
 * Fetch a single staff member by user ID
 */
export async function fetchStaffById(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch staff: ${error.message}`);
  }

  return data as SupabaseProfile;
}

/**
 * Create a new staff member via edge function
 */
export async function createStaff(params: CreateStaffParams) {
  const { data, error } = await supabase.functions.invoke('staff-invite', {
    body: {
      email: params.email,
      full_name: params.full_name,
      role: params.role,
      branch: params.branch,
      institution_id: params.institution_id,
      onboarding_method: params.onboarding_method || 'invite',
      password: params.password
    }
  });

  if (error) {
    throw new Error(`Failed to create staff: ${error.message}`);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data?.profile as SupabaseProfile;
}

/**
 * Update staff member profile
 */
export async function updateStaff(userId: string, params: UpdateStaffParams) {
  const { data, error } = await supabase
    .from('profiles')
    .update(params)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update staff: ${error.message}`);
  }

  return data as SupabaseProfile;
}

/**
 * Suspend a staff member
 */
export async function suspendStaff(userId: string) {
  return updateStaff(userId, { status: 'SUSPENDED' });
}

/**
 * Activate a staff member
 */
export async function activateStaff(userId: string) {
  return updateStaff(userId, { status: 'ACTIVE' });
}

/**
 * Search staff by name or email
 */
export async function searchStaff(institutionId: string, searchTerm: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('institution_id', institutionId)
    .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Failed to search staff: ${error.message}`);
  }

  return data as SupabaseProfile[];
}

