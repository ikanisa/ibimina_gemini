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
    
    const isPlatformAdmin = roleUpper === 'SUPER ADMIN' || roleUpper === 'PLATFORM_ADMIN';
    const isInstitutionAdmin = isPlatformAdmin || roleUpper === 'BRANCH MANAGER' || roleUpper === 'INSTITUTION_ADMIN';
    const isStaff = isInstitutionAdmin || roleUpper === 'INSTITUTION_STAFF' || roleUpper === 'TREASURER';
    const isAuditor = roleUpper === 'INSTITUTION_AUDITOR' || roleUpper === 'AUDITOR';

    return {
      isPlatformAdmin,
      isInstitutionAdmin,
      isStaff,
      isAuditor,
      canManageStaff: isInstitutionAdmin,
      canViewAuditLog: isInstitutionAdmin || isAuditor,
      canManageSystem: isPlatformAdmin,
    };
  }, [role]);
}
