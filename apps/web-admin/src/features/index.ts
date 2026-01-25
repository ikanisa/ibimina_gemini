/**
 * Features Module - Feature-based code organization
 * 
 * Each feature contains its own components, hooks, services, and types.
 * Import from specific features for better tree-shaking:
 * 
 * @example
 * import { Dashboard, useDashboardKPIs } from '@/features/dashboard';
 * import { Transactions, useTransactions } from '@/features/transactions';
 * import { Groups, Members } from '@/features/directory';
 */

export * from './dashboard';
export * from './transactions';
export * from './directory';
export * from './reports';
export * from './settings';
export * from './auth';
