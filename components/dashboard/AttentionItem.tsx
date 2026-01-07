import React from 'react';
import { AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react';

interface AttentionItemProps {
  type: string;
  title: string;
  count: number;
  severity: 'high' | 'medium' | 'low';
  actionPath: string;
  onAction: (path: string) => void;
}

export const AttentionItem: React.FC<AttentionItemProps> = ({
  type,
  title,
  count,
  severity,
  actionPath,
  onAction
}) => {
  const getSeverityStyles = () => {
    switch (severity) {
      case 'high':
        return {
          container: 'bg-red-50 border-red-200 hover:bg-red-100',
          icon: AlertCircle,
          iconColor: 'text-red-600',
          badge: 'bg-red-100 text-red-700',
          text: 'text-red-900'
        };
      case 'medium':
        return {
          container: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
          badge: 'bg-amber-100 text-amber-700',
          text: 'text-amber-900'
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
          icon: Info,
          iconColor: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-700',
          text: 'text-blue-900'
        };
    }
  };

  const styles = getSeverityStyles();
  const Icon = styles.icon;

  const getActionText = () => {
    switch (type) {
      case 'unallocated':
        return 'Go allocate';
      case 'parse_error':
        return 'Review errors';
      case 'sms_offline':
        return 'Check sources';
      case 'missing_momo':
        return 'Add code';
      default:
        return 'View';
    }
  };

  return (
    <button
      onClick={() => onAction(actionPath)}
      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${styles.container}`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={styles.iconColor} />
        <div className="text-left">
          <p className={`text-sm font-semibold ${styles.text}`}>{title}</p>
          <p className="text-xs text-slate-500">{count} item{count !== 1 ? 's' : ''} need attention</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles.badge}`}>
          {count}
        </span>
        <span className={`text-xs font-medium ${styles.text} hidden sm:inline`}>
          {getActionText()}
        </span>
        <ChevronRight size={16} className={styles.iconColor} />
      </div>
    </button>
  );
};

export default AttentionItem;

