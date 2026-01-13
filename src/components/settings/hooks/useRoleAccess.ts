/**
 * Role Access Hook
 * Centralized role-based access control for settings
 */

import { useAuth } from '../../../contexts/AuthContext';
import { useMemo } from 'react';

export type UserRole = 'PLATFORM_ADMIN' | 'INSTITUTION_ADMIN' | 'INSTITUTION_STAFF' | 'INSTITUTION_AUDITOR';

export interface RoleAccess {
  isPlatformAdmin: boolean;
  isInstitutionAdmin: boolean;
  isStaff: boolean;
  isAuditor: boolean;
  canManageStaff: boolean;
  canViewAuditLog: boolean;
  canManageSystem: boolean;
}

export function useRoleAccess(): RoleAccess {
  const { role } = useAuth();

  return useMemo(() => {
    const roleUpper = role?.toUpperCase() || '';
    
    // Simplified role system: Admin and Staff only
    const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'PLATFORM_ADMIN' || roleUpper === 'INSTITUTION_ADMIN';
    const isStaff = roleUpper === 'STAFF' || roleUpper === 'INSTITUTION_STAFF' || roleUpper === 'INSTITUTION_TREASURER' || roleUpper === 'INSTITUTION_AUDITOR';

    return {
      isPlatformAdmin: isAdmin,
      isInstitutionAdmin: isAdmin,
      isStaff: isStaff || isAdmin, // Admin is also considered staff
      isAuditor: isStaff, // All staff can audit
      canManageStaff: isAdmin,
      canViewAuditLog: isAdmin || isStaff,
      canManageSystem: isAdmin,
    };
  }, [role]);
}
