/**
 * MFA (Multi-Factor Authentication) Utilities
 * Handles TOTP MFA setup, verification, and management
 */

import { supabase } from '../supabase';

export interface MFAFactor {
  id: string;
  type: 'totp';
  friendly_name?: string;
  status: 'verified' | 'unverified';
  created_at: string;
}

export interface MFASetupResponse {
  qr_code: string;
  secret: string;
  uri: string;
}

export interface MFABackupCodes {
  codes: string[];
  created_at: string;
}

/**
 * Check if user has MFA enabled
 */
export async function hasMFAEnabled(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      console.error('Error checking MFA status:', error);
      return false;
    }
    
    // Check if user has any verified TOTP factors
    return data?.totp?.some(factor => factor.status === 'verified') ?? false;
  } catch (error) {
    console.error('MFA check failed:', error);
    return false;
  }
}

/**
 * Get all MFA factors for current user
 */
export async function getMFAFactors(): Promise<MFAFactor[]> {
  try {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      throw error;
    }
    
    return (data?.totp ?? []).map(factor => ({
      id: factor.id,
      type: 'totp' as const,
      friendly_name: factor.friendly_name,
      status: factor.status as 'verified' | 'unverified',
      created_at: factor.created_at,
    }));
  } catch (error) {
    console.error('Error getting MFA factors:', error);
    throw error;
  }
}

/**
 * Start MFA enrollment (TOTP)
 * Returns QR code and secret for authenticator app
 */
export async function startMFAEnrollment(friendlyName?: string): Promise<MFASetupResponse> {
  try {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: friendlyName || 'Authenticator App',
    });
    
    if (error) {
      throw error;
    }
    
    return {
      qr_code: data.qr_code,
      secret: data.secret,
      uri: data.uri,
    };
  } catch (error) {
    console.error('Error starting MFA enrollment:', error);
    throw error;
  }
}

/**
 * Verify and complete MFA enrollment
 */
export async function verifyMFAEnrollment(factorId: string, code: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      code,
    });
    
    if (error) {
      throw error;
    }
    
    return data.verified;
  } catch (error) {
    console.error('Error verifying MFA enrollment:', error);
    throw error;
  }
}

/**
 * Unenroll MFA factor
 */
export async function unenrollMFA(factorId: string): Promise<void> {
  try {
    const { error } = await supabase.auth.mfa.unenroll({
      factorId,
    });
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error unenrolling MFA:', error);
    throw error;
  }
}

/**
 * Challenge MFA (for login verification)
 */
export async function challengeMFA(factorId: string): Promise<{ challengeId: string }> {
  try {
    const { data, error } = await supabase.auth.mfa.challenge({
      factorId,
    });
    
    if (error) {
      throw error;
    }
    
    return {
      challengeId: data.id,
    };
  } catch (error) {
    console.error('Error challenging MFA:', error);
    throw error;
  }
}

/**
 * Verify MFA challenge (for login)
 */
export async function verifyMFAChallenge(challengeId: string, code: string): Promise<{ verified: boolean }> {
  try {
    const { data, error } = await supabase.auth.mfa.verify({
      challengeId,
      code,
    });
    
    if (error) {
      throw error;
    }
    
    return {
      verified: data.verified ?? false,
    };
  } catch (error) {
    console.error('Error verifying MFA challenge:', error);
    throw error;
  }
}

/**
 * Generate backup codes for MFA recovery
 * Note: Supabase doesn't have built-in backup codes, so we'll store them in the database
 */
export async function generateBackupCodes(): Promise<MFABackupCodes> {
  // Generate 10 random 8-digit codes
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    codes.push(code);
  }
  
  const createdAt = new Date().toISOString();
  
  // Store backup codes in database (hashed)
  // Note: In production, these should be hashed before storage
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Store backup codes in user metadata or separate table
      // For now, we'll return them to be stored client-side (not ideal, but functional)
      // TODO: Implement proper backup code storage in database
    }
  } catch (error) {
    console.error('Error storing backup codes:', error);
  }
  
  return {
    codes,
    created_at: createdAt,
  };
}

/**
 * Verify backup code
 * Note: This is a simplified implementation
 * In production, backup codes should be hashed and stored in the database
 */
export async function verifyBackupCode(code: string): Promise<boolean> {
  // TODO: Implement proper backup code verification from database
  // For now, this is a placeholder
  return false;
}

/**
 * Check if MFA is required for user role
 */
export function isMFARequired(role: string | null): boolean {
  // Require MFA for admin roles
  const adminRoles = ['Admin', 'Platform Admin', 'Super Admin'];
  return role ? adminRoles.includes(role) : false;
}
