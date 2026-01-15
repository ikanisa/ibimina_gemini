/**
 * Role helper utilities
 * Centralizes role checking logic to ensure consistency across the app
 * 
 * Only 2 roles: ADMIN and STAFF
 */

/**
 * Check if a role is Admin
 */
export function isSuperAdmin(role: string | null | undefined): boolean {
  if (!role) return false;
  return role.toUpperCase() === 'ADMIN';
}

/**
 * Check if a role is Admin (alias for isSuperAdmin)
 */
export function isAdmin(role: string | null | undefined): boolean {
  return isSuperAdmin(role);
}

/**
 * Check if a role is Staff
 */
export function isStaff(role: string | null | undefined): boolean {
  if (!role) return false;
  return role.toUpperCase() === 'STAFF';
}

/**
 * @deprecated Use isAdmin instead
 */
export function isBranchManager(role: string | null | undefined): boolean {
  return isAdmin(role);
}
