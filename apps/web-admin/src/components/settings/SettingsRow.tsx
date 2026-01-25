import React, { ReactNode } from 'react';
import { Edit2 } from 'lucide-react';

interface SettingsRowProps {
  label: string;
  value: ReactNode;
  description?: string;
  onEdit?: () => void;
  editLabel?: string;
  isLast?: boolean;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  value,
  description,
  onEdit,
  editLabel = 'Edit',
  isLast = false
}) => {
  return (
    <div className={`flex items-start justify-between py-4 ${!isLast ? 'border-b border-slate-100' : ''}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <div className="mt-1">
          {typeof value === 'string' ? (
            <p className="text-sm text-slate-900">{value}</p>
          ) : (
            value
          )}
        </div>
        {description && (
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        )}
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium ml-4 shrink-0"
        >
          <Edit2 size={14} />
          {editLabel}
        </button>
      )}
    </div>
  );
};

export default SettingsRow;


