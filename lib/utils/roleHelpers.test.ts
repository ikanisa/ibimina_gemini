/**
 * Role Helpers Tests
 */

import { describe, it, expect } from 'vitest';
import { isSuperAdmin, isAdmin, isBranchManager } from './roleHelpers';

describe('isSuperAdmin', () => {
  it('should identify super admin roles', () => {
    expect(isSuperAdmin('Admin')).toBe(true);
    expect(isSuperAdmin('ADMIN')).toBe(true);
    expect(isSuperAdmin('INSTITUTION_ADMIN')).toBe(true);
    expect(isSuperAdmin('PLATFORM_ADMIN')).toBe(true);
  });

  it('should reject non-admin roles', () => {
    expect(isSuperAdmin('Staff')).toBe(false);
    expect(isSuperAdmin('INSTITUTION_STAFF')).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
    expect(isSuperAdmin(undefined)).toBe(false);
  });
});

describe('isAdmin', () => {
  it('should check admin status', () => {
    expect(isAdmin('Admin')).toBe(true);
    expect(isAdmin('INSTITUTION_ADMIN')).toBe(true);
    expect(isAdmin('Staff')).toBe(false);
  });
});

describe('isBranchManager', () => {
  it('should check branch manager status', () => {
    expect(isBranchManager('Admin')).toBe(true);
    expect(isBranchManager('INSTITUTION_ADMIN')).toBe(true);
    expect(isBranchManager('Staff')).toBe(false);
  });
});
