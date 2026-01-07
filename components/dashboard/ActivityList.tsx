import React from 'react';
import { 
  Activity, 
  UserPlus, 
  FileText, 
  Settings, 
  Link, 
  LogIn, 
  Upload,
  CreditCard,
  Users
} from 'lucide-react';

interface ActivityItem {
  id: string;
  created_at: string;
  action: string;
  entity_type: string;
  actor_email: string | null;
  metadata: Record<string, unknown> | null;
}

interface ActivityListProps {
  title: string;
  items: ActivityItem[];
  onViewAll: () => void;
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getActionIcon = (action: string, entityType: string) => {
  if (action.includes('login')) return LogIn;
  if (action.includes('allocate')) return Link;
  if (action.includes('import') || action.includes('upload')) return Upload;
  if (action.includes('settings') || action.includes('config')) return Settings;
  if (action.includes('momo') || action.includes('payment')) return CreditCard;
  if (entityType === 'member') return UserPlus;
  if (entityType === 'group') return Users;
  return Activity;
};

const getActionColor = (action: string) => {
  if (action.includes('create') || action.includes('add') || action.includes('register')) 
    return { bg: 'bg-green-100', text: 'text-green-600' };
  if (action.includes('update') || action.includes('change') || action.includes('allocate')) 
    return { bg: 'bg-blue-100', text: 'text-blue-600' };
  if (action.includes('delete') || action.includes('remove') || action.includes('deactivate')) 
    return { bg: 'bg-red-100', text: 'text-red-600' };
  if (action.includes('login') || action.includes('logout')) 
    return { bg: 'bg-purple-100', text: 'text-purple-600' };
  return { bg: 'bg-slate-100', text: 'text-slate-600' };
};

const formatAction = (action: string) => {
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

export const ActivityList: React.FC<ActivityListProps> = ({
  title,
  items,
  onViewAll
}) => {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">{title}</h3>
        </div>
        <div className="p-8 text-center text-slate-400">
          <Activity size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <button
          onClick={onViewAll}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          View audit log
        </button>
      </div>
      <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
        {items.map(item => {
          const Icon = getActionIcon(item.action, item.entity_type);
          const colors = getActionColor(item.action);
          
          return (
            <div key={item.id} className="px-5 py-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center shrink-0`}>
                  <Icon size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-900">
                    <span className="font-medium">{formatAction(item.action)}</span>
                    <span className="text-slate-500"> on </span>
                    <span className="text-slate-700">{item.entity_type}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span>{item.actor_email || 'System'}</span>
                    <span>•</span>
                    <span>{formatTime(item.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityList;

