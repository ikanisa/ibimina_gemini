/**
 * Role Access Hook
 * Centralized role-based access control for settings
 * 
 * Only 2 roles: ADMIN and STAFF
 */

import { useAuth } from '../../../contexts/AuthContext';
import { useMemo } from 'react';

export type UserRole = 'ADMIN' | 'STAFF';

export interface RoleAccess {
  isAdmin: boolean;
  isStaff: boolean;
  canManageStaff: boolean;
  canViewAuditLog: boolean;
  canManageSystem: boolean;
}

export function useRoleAccess(): RoleAccess {
  const { role } = useAuth();

  return useMemo(() => {
    const isAdmin = role?.toUpperCase() === 'ADMIN';
    const isStaff = role?.toUpperCase() === 'STAFF';

    return {
      isAdmin,
      isStaff: isStaff || isAdmin, // Admin can do everything Staff can
      canManageStaff: isAdmin,
      canViewAuditLog: isAdmin || isStaff,
      canManageSystem: isAdmin,
    };
  }, [role]);
}
