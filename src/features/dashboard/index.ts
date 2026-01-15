/**
 * Dashboard Feature Module
 * 
 * Exports all dashboard-related components, hooks, and services.
 */

// Components
export { default as Dashboard } from './components/Dashboard';
export { default as MinimalistDashboard } from './components/MinimalistDashboard';
export { ActivityList } from './components/ActivityList';
export { AttentionItem } from './components/AttentionItem';
export { DashboardHealthBanner } from './components/DashboardHealthBanner';
export { DashboardSkeleton } from './components/DashboardSkeleton';
export { InstitutionSwitcher } from './components/InstitutionSwitcher';
export { KpiCard } from './components/KpiCard';
export { PreviewList } from './components/PreviewList';

// Hooks
export { useDashboardKPIs, DEFAULT_DASHBOARD_DATA } from './hooks/useDashboardKPIs';
export type { DashboardData } from './hooks/useDashboardKPIs';
export { useDashboardStats } from './hooks/useDashboardStats';

// Services
export { dashboardService } from './services/dashboardService';
export type {
    DashboardSummary,
    DashboardKPIs,
    RecentActivity,
} from './services/dashboardService';
