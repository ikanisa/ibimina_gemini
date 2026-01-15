/**
 * Settings Page Component
 * Minimalist, reusable page wrapper for settings pages
 */

import React, { ReactNode } from 'react';
import { HealthBanner } from './HealthBanner';
import { SaveBar } from './SaveBar';
import { HealthIssue } from '@/features/settings/types';

interface SettingsPageProps {
  title: string;
  description?: string;
  children: ReactNode;
  healthIssues?: HealthIssue[];
  error?: string | null;
  isDirty?: boolean;
  isSaving?: boolean;
  onSave?: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  actions?: ReactNode;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  title,
  description,
  children,
  healthIssues = [],
  error,
  isDirty = false,
  isSaving = false,
  onSave,
  onCancel,
  loading = false,
  actions
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {description && (
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          )}
        </div>
        {actions}
      </div>

      {/* Health Banner */}
      {healthIssues.length > 0 && <HealthBanner issues={healthIssues} />}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Content */}
      {children}

      {/* Save Bar */}
      {isDirty && (onSave || onCancel) && (
        <SaveBar 
          isDirty={isDirty} 
          isSaving={isSaving} 
          onSave={onSave} 
          onCancel={onCancel} 
        />
      )}
    </div>
  );
};

export default SettingsPage;
