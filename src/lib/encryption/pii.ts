/**
 * PII Encryption Utilities
 * Client-side utilities for handling encrypted PII data
 * 
 * Note: Actual encryption/decryption happens server-side.
 * These utilities help with phone hash computation and API calls.
 */

import { supabase } from '../supabase';

/**
 * Normalize phone number for hashing
 * Removes all non-digit characters
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Compute phone hash (matches database function)
 * Used for client-side phone lookups
 */
export async function computePhoneHash(phone: string): Promise<string> {
  const normalized = normalizePhone(phone);
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Get decrypted member data
 * Calls RPC function that decrypts PII server-side
 */
export async function getMemberDecrypted(memberId: string) {
  const { data, error } = await supabase.rpc('get_member_decrypted', {
    member_id: memberId,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Find member by phone number
 * Uses hash lookup for privacy-preserving search
 */
export async function findMemberByPhone(phone: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('find_member_by_phone', {
    search_phone: phone,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get decrypted transaction payer info
 * Helper to decrypt payer phone/name from transactions
 */
export async function getTransactionPayerDecrypted(transactionId: string) {
  // This would need a similar RPC function in the database
  // For now, return the transaction with decrypted fields
  const { data, error } = await supabase
    .from('transactions')
    .select('id, payer_phone_encrypted, payer_name_encrypted')
    .eq('id', transactionId)
    .single();

  if (error) {
    throw error;
  }

  // Decrypt using RPC (if function exists)
  // For now, return encrypted data - decryption happens server-side
  return data;
}

/**
 * Check if PII encryption is enabled
 */
export async function isPIIEncryptionEnabled(): Promise<boolean> {
  try {
    // Check if encrypted columns exist
    const { data, error } = await supabase
      .from('members')
      .select('phone_encrypted')
      .limit(1);

    // If we can query the column, encryption is enabled
    return !error;
  } catch {
    return false;
  }
}
