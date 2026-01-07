import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, ChevronRight } from 'lucide-react';

interface HealthIssue {
  type: 'warning' | 'alert' | 'info' | 'success';
  message: string;
  action?: string;
  onClick?: () => void;
}

interface HealthBannerProps {
  issues: HealthIssue[];
  className?: string;
}

export const HealthBanner: React.FC<HealthBannerProps> = ({ issues, className = '' }) => {
  if (issues.length === 0) {
    return (
      <div className={`flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl ${className}`}>
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
          <CheckCircle2 size={18} />
        </div>
        <div>
          <p className="text-sm font-medium text-green-800">All systems healthy</p>
          <p className="text-xs text-green-600">No configuration issues detected</p>
        </div>
      </div>
    );
  }

  const getIssueStyles = (type: HealthIssue['type']) => {
    switch (type) {
      case 'alert':
        return {
          container: 'bg-red-50 border-red-200',
          icon: XCircle,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          text: 'text-red-800',
          subtext: 'text-red-600'
        };
      case 'warning':
        return {
          container: 'bg-amber-50 border-amber-200',
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
          iconBg: 'bg-amber-100',
          text: 'text-amber-800',
          subtext: 'text-amber-600'
        };
      case 'success':
        return {
          container: 'bg-green-50 border-green-200',
          icon: CheckCircle2,
          iconColor: 'text-green-600',
          iconBg: 'bg-green-100',
          text: 'text-green-800',
          subtext: 'text-green-600'
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: Info,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100',
          text: 'text-blue-800',
          subtext: 'text-blue-600'
        };
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {issues.map((issue, index) => {
        const styles = getIssueStyles(issue.type);
        const Icon = styles.icon;
        
        return (
          <div
            key={index}
            className={`flex items-start gap-3 p-4 border rounded-xl ${styles.container} ${
              issue.onClick ? 'cursor-pointer hover:shadow-sm transition-shadow' : ''
            }`}
            onClick={issue.onClick}
          >
            <div className={`w-8 h-8 rounded-full ${styles.iconBg} flex items-center justify-center ${styles.iconColor} shrink-0`}>
              <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${styles.text}`}>{issue.message}</p>
              {issue.action && (
                <p className={`text-xs ${styles.subtext} mt-0.5`}>{issue.action}</p>
              )}
            </div>
            {issue.onClick && (
              <ChevronRight size={18} className={styles.iconColor} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default HealthBanner;


