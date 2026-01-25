/**
 * Role Helpers Tests
 * 
 * Only 2 roles: ADMIN and STAFF
 */

import { describe, it, expect } from 'vitest';
import { isSuperAdmin, isAdmin, isStaff } from './roleHelpers';

describe('isSuperAdmin', () => {
  it('should identify admin role', () => {
    expect(isSuperAdmin('Admin')).toBe(true);
    expect(isSuperAdmin('ADMIN')).toBe(true);
    expect(isSuperAdmin('admin')).toBe(true);
  });

  it('should reject non-admin roles', () => {
    expect(isSuperAdmin('Staff')).toBe(false);
    expect(isSuperAdmin('STAFF')).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
    expect(isSuperAdmin(undefined)).toBe(false);
  });
});

describe('isAdmin', () => {
  it('should check admin status', () => {
    expect(isAdmin('Admin')).toBe(true);
    expect(isAdmin('ADMIN')).toBe(true);
    expect(isAdmin('Staff')).toBe(false);
  });
});

describe('isStaff', () => {
  it('should check staff status', () => {
    expect(isStaff('Staff')).toBe(true);
    expect(isStaff('STAFF')).toBe(true);
    expect(isStaff('Admin')).toBe(false);
    expect(isStaff('ADMIN')).toBe(false);
  });
});
