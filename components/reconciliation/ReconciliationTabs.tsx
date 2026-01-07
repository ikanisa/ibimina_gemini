import React from 'react';
import { AlertTriangle, Copy, CheckCircle2 } from 'lucide-react';

export type ReconciliationTab = 'unallocated' | 'parse-errors' | 'duplicates';

interface TabCount {
  unallocated: number;
  parseErrors: number;
  duplicates: number;
}

interface ReconciliationTabsProps {
  activeTab: ReconciliationTab;
  onTabChange: (tab: ReconciliationTab) => void;
  counts: TabCount;
}

const ReconciliationTabs: React.FC<ReconciliationTabsProps> = ({
  activeTab,
  onTabChange,
  counts,
}) => {
  const tabs: { id: ReconciliationTab; label: string; count: number; icon: React.ReactNode }[] = [
    {
      id: 'unallocated',
      label: 'Unallocated',
      count: counts.unallocated,
      icon: <CheckCircle2 size={16} />,
    },
    {
      id: 'parse-errors',
      label: 'Parse Errors',
      count: counts.parseErrors,
      icon: <AlertTriangle size={16} />,
    },
    {
      id: 'duplicates',
      label: 'Duplicates',
      count: counts.duplicates,
      icon: <Copy size={16} />,
    },
  ];

  return (
    <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 md:px-6 py-3 md:py-4 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === tab.id
              ? 'bg-white border-t-2 border-t-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.count > 0 && (
            <span
              className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : tab.count > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default ReconciliationTabs;

