/**
 * Settings Constants
 * Centralized configuration for settings module
 */

import { Building, Cpu, Smartphone, Users, FileText, Server, Bell } from 'lucide-react';
import { SettingsNavItem } from './types';

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  { 
    id: 'institution', 
    label: 'Institution & MoMo', 
    icon: Building,
    description: 'Manage institution profile and MoMo codes'
  },
  { 
    id: 'parsing', 
    label: 'Parsing', 
    icon: Cpu,
    description: 'Configure SMS parsing settings'
  },
  { 
    id: 'sms-sources', 
    label: 'SMS Sources', 
    icon: Smartphone,
    description: 'Manage SMS source devices'
  },
  { 
    id: 'notifications', 
    label: 'Notifications', 
    icon: Bell,
    description: 'Send reports and notifications to members and leaders'
  },
  { 
    id: 'staff', 
    label: 'Staff', 
    icon: Users, 
    adminOnly: true,
    description: 'Manage staff members'
  },
  { 
    id: 'audit-log', 
    label: 'Audit Log', 
    icon: FileText, 
    adminOnly: true,
    description: 'View system activity'
  },
  { 
    id: 'system', 
    label: 'System', 
    icon: Server, 
    platformOnly: true,
    description: 'Platform-wide settings'
  },
];
