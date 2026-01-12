/**
 * Role helper utilities
 * Centralizes role checking logic to ensure consistency across the app
 */

import type { StaffRole } from '../../types';

/**
 * Check if a role is Admin
 * Handles both 'Admin' and legacy database values
 */
export function isSuperAdmin(role: StaffRole | null | undefined): boolean {
  if (!role) return false;
  const roleUpper = role.toUpperCase();
  return roleUpper === 'ADMIN' || roleUpper === 'PLATFORM_ADMIN' || roleUpper === 'INSTITUTION_ADMIN';
}

/**
 * Check if a role is Admin (alias for isSuperAdmin for backward compatibility)
 */
export function isBranchManager(role: StaffRole | null | undefined): boolean {
  return isSuperAdmin(role);
}

/**
 * Check if a role has admin privileges
 */
export function isAdmin(role: StaffRole | null | undefined): boolean {
  return isSuperAdmin(role);
}
