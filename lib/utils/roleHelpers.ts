/**
 * Role helper utilities
 * Centralizes role checking logic to ensure consistency across the app
 */

import type { StaffRole } from '../../types';

/**
 * Check if a role is Super Admin (platform admin)
 * Handles both normalized 'Super Admin' and database 'PLATFORM_ADMIN' values
 */
export function isSuperAdmin(role: StaffRole | null | undefined): boolean {
  if (!role) return false;
  const roleUpper = role.toUpperCase();
  return roleUpper === 'SUPER ADMIN' || roleUpper === 'PLATFORM_ADMIN';
}

/**
 * Check if a role is Branch Manager (institution admin)
 */
export function isBranchManager(role: StaffRole | null | undefined): boolean {
  if (!role) return false;
  const roleUpper = role.toUpperCase();
  return roleUpper === 'BRANCH MANAGER' || roleUpper === 'INSTITUTION_ADMIN';
}

/**
 * Check if a role has admin privileges (Super Admin or Branch Manager)
 */
export function isAdmin(role: StaffRole | null | undefined): boolean {
  return isSuperAdmin(role) || isBranchManager(role);
}
