/**
 * PII Encryption Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizePhone, computePhoneHash } from './pii';

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe('normalizePhone', () => {
  it('should normalize phone numbers', () => {
    // normalizePhone from pii.ts removes all non-digit characters
    expect(normalizePhone('0788123456')).toBe('0788123456');
    expect(normalizePhone('+250788123456')).toBe('250788123456');
    expect(normalizePhone('788-123-456')).toBe('788123456');
  });

  it('should handle empty strings', () => {
    expect(normalizePhone('')).toBe('');
  });
});

describe('computePhoneHash', () => {
  it('should hash phone numbers consistently', async () => {
    const phone = '+250788123456';
    const hash1 = await computePhoneHash(phone);
    const hash2 = await computePhoneHash(phone);
    expect(hash1).toBe(hash2);
    expect(hash1).toBeTruthy();
    expect(typeof hash1).toBe('string');
    expect(hash1.length).toBe(64); // SHA-256 produces 64 hex characters
  });

  it('should produce different hashes for different phones', async () => {
    const hash1 = await computePhoneHash('+250788123456');
    const hash2 = await computePhoneHash('+250788123457');
    expect(hash1).not.toBe(hash2);
  });
});
