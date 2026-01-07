import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Wifi, WifiOff, CreditCard } from 'lucide-react';

interface HealthData {
  momo_primary_code_present: boolean;
  sms_sources_last_seen: string | null;
  sms_sources_offline_count: number;
  sms_sources_total_count: number;
  overall_status: 'healthy' | 'warning' | 'critical';
}

interface DashboardHealthBannerProps {
  health: HealthData;
  onNavigate: (path: string) => void;
}

export const DashboardHealthBanner: React.FC<DashboardHealthBannerProps> = ({
  health,
  onNavigate
}) => {
  // If everything is healthy, show success
  if (health.overall_status === 'healthy') {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
          <CheckCircle2 size={18} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800">All systems operational</p>
          <p className="text-xs text-green-600">SMS sources active • MoMo code configured</p>
        </div>
      </div>
    );
  }

  const issues = [];

  if (!health.momo_primary_code_present) {
    issues.push({
      type: 'momo',
      icon: CreditCard,
      message: 'No primary MoMo code configured',
      action: 'Add MoMo Code',
      path: '/settings/institution'
    });
  }

  if (health.sms_sources_total_count === 0) {
    issues.push({
      type: 'sms',
      icon: WifiOff,
      message: 'No SMS sources configured',
      action: 'Add SMS Source',
      path: '/settings/sms-sources'
    });
  } else if (health.sms_sources_offline_count > 0) {
    issues.push({
      type: 'sms',
      icon: WifiOff,
      message: `${health.sms_sources_offline_count} SMS source${health.sms_sources_offline_count > 1 ? 's' : ''} offline`,
      action: 'Check Sources',
      path: '/settings/sms-sources'
    });
  }

  return (
    <div className="space-y-2">
      {issues.map((issue, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <issue.icon size={18} />
            </div>
            <p className="text-sm font-medium text-amber-800">{issue.message}</p>
          </div>
          <button
            onClick={() => onNavigate(issue.path)}
            className="text-xs font-medium text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            {issue.action}
          </button>
        </div>
      ))}
    </div>
  );
};

export default DashboardHealthBanner;

