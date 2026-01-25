/**
 * Settings Feature Module
 * 
 * Exports all settings-related components, hooks, and services.
 */

// Components
export { default as Settings } from './components/Settings';
export { DrawerForm } from './components/DrawerForm';
export { HealthBanner } from './components/HealthBanner';
export { SaveBar } from './components/SaveBar';
export { SettingsCard } from './components/SettingsCard';
export { SettingsLayout } from './components/SettingsLayout';
export { SettingsPage } from './components/SettingsPage';
export { SettingsRow } from './components/SettingsRow';

// Settings pages
export {
    SettingsHome,
    InstitutionSettings,
    ParsingSettings,
    SmsSourcesSettings,
    NotificationsSettings,
    StaffSettings,
    AuditLogSettings,
    SystemSettings,
} from './components/pages';

// Services
export { settingsService } from './services/settingsService';
export type {
    InstitutionSettings as InstitutionSettingsData,
    StaffMember,
    SmsSource,
    AuditLogEntry,
} from './services/settingsService';

// Types and constants
export * from './types';
export * from './constants';

