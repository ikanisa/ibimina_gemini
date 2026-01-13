/**
 * Settings Types
 * Shared types for settings module
 */

export type SettingsTab = 
  | 'home' 
  | 'institution' 
  | 'parsing' 
  | 'sms-sources' 
  | 'notifications'
  | 'staff' 
  | 'audit-log' 
  | 'system';

export interface SettingsNavItem {
  id: SettingsTab;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  platformOnly?: boolean;
  description?: string;
}

export interface HealthIssue {
  type: 'info' | 'warning' | 'alert' | 'success';
  message: string;
  action?: string;
  onClick?: () => void;
}
