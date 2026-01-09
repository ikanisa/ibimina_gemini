# UI/UX Refactoring Implementation Plan
**Detailed implementation guide with code examples and step-by-step instructions**

---

## Phase 1: Design System Foundation

### Step 1.1: Create Design Tokens

**File:** `lib/design-tokens.ts`

```typescript
/**
 * Design System Tokens
 * Centralized design values for consistent UI
 */

export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb', // Main primary
    700: '#1d4ed8',
  },
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a', // Main success
    700: '#15803d',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706', // Main warning
    700: '#b45309',
  },
  danger: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626', // Main danger
    700: '#b91c1c',
  },
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
} as const;

export const spacing = {
  xs: '0.5rem',   // 8px
  sm: '0.75rem',  // 12px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
} as const;

export const borderRadius = {
  sm: '0.25rem',  // 4px
  md: '0.5rem',   // 8px
  lg: '0.75rem',  // 12px
  xl: '1rem',     // 16px
} as const;

export const typography = {
  fontFamily: {
    sans: ['Inter', 'sans-serif'],
    mono: ['Menlo', 'Monaco', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
} as const;

export const transitions = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
} as const;
```

### Step 1.2: Create Card Component

**File:** `components/ui/Card.tsx`

```typescript
import React from 'react';
import { cn } from '../utils/cn'; // Utility for className merging

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  hover = false,
  onClick,
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-slate-200',
        paddingClasses[padding],
        hover && 'hover:border-slate-300 transition-colors cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn('mb-4 pb-4 border-b border-slate-100', className)}>
    {children}
  </div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <h3 className={cn('text-lg font-semibold text-slate-900', className)}>
    {children}
  </h3>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={className}>{children}</div>
);
```

### Step 1.3: Create StatusIndicator Component

**File:** `components/ui/StatusIndicator.tsx`

```typescript
import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '../utils/cn';

export type Status = 'active' | 'pending' | 'inactive' | 'error' | 'warning';

interface StatusIndicatorProps {
  status: Status;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  active: {
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: CheckCircle,
  },
  pending: {
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: Clock,
  },
  inactive: {
    color: 'text-slate-400',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    icon: XCircle,
  },
  error: {
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: XCircle,
  },
  warning: {
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: AlertCircle,
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'md',
  showIcon = true,
  className,
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.color,
        config.bg,
        config.border,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />}
      {label || status}
    </span>
  );
};
```

### Step 1.4: Create Table Component

**File:** `components/ui/Table.tsx`

```typescript
import React from 'react';
import { cn } from '../utils/cn';

export const Table: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className="overflow-x-auto">
    <table className={cn('w-full text-left', className)}>
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <thead className={cn('bg-slate-50 border-b border-slate-200', className)}>
    {children}
  </thead>
);

export const TableRow: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}> = ({ children, className, onClick, hover = true }) => (
  <tr
    className={cn(
      'border-b border-slate-100',
      hover && 'hover:bg-slate-50',
      onClick && 'cursor-pointer',
      className
    )}
    onClick={onClick}
  >
    {children}
  </tr>
);

export const TableHead: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <th
    className={cn(
      'px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider',
      className
    )}
  >
    {children}
  </th>
);

export const TableCell: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <td className={cn('px-4 py-3 text-sm text-slate-900', className)}>
    {children}
  </td>
);
```

### Step 1.5: Create Layout Components

**File:** `components/layout/PageLayout.tsx`

```typescript
import React from 'react';
import { cn } from '../utils/cn';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  description,
  actions,
  className,
}) => {
  return (
    <div className={cn('space-y-6', className)}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            {title && (
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            )}
            {description && (
              <p className="text-sm text-slate-500 mt-1">{description}</p>
            )}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
```

**File:** `components/layout/Section.tsx`

```typescript
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { cn } from '../utils/cn';

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
  title,
  children,
  className,
  headerActions,
}) => {
  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{title}</CardTitle>
            {headerActions}
          </div>
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
};
```

---

## Phase 2: Component Refactoring Examples

### Example 2.1: Refactoring Groups Component

**Before:** Single 1,410-line file

**After:** Modular structure

**Step 1:** Extract GroupsList

**File:** `components/groups/GroupsList.tsx`

```typescript
import React from 'react';
import { Group } from '../types';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../ui/Table';
import { StatusIndicator } from '../ui/StatusIndicator';
import { Calendar, ChevronRight } from 'lucide-react';

interface GroupsListProps {
  groups: Group[];
  onSelectGroup: (group: Group) => void;
  searchTerm?: string;
}

export const GroupsList: React.FC<GroupsListProps> = ({
  groups,
  onSelectGroup,
  searchTerm = '',
}) => {
  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Group Name</TableHead>
          <TableHead>Cycle</TableHead>
          <TableHead>Meeting Day</TableHead>
          <TableHead>Members</TableHead>
          <TableHead className="text-right">Fund Balance</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <tbody>
        {filteredGroups.map((group) => (
          <TableRow
            key={group.id}
            onClick={() => onSelectGroup(group)}
            hover
          >
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                  {group.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{group.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{group.code}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-sm text-slate-600">
              {group.cycleLabel}
            </TableCell>
            <TableCell>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                <Calendar size={12} />
                {group.meetingDay}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"
                  />
                ))}
                <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-medium text-slate-600">
                  +{Math.max(group.memberCount - 3, 0)}
                </div>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <span className="text-sm font-bold text-slate-900">
                {group.fundBalance.toLocaleString()} RWF
              </span>
            </TableCell>
            <TableCell className="text-center">
              <StatusIndicator
                status={group.status === 'Active' ? 'active' : 'inactive'}
                label={group.status}
                size="sm"
              />
            </TableCell>
            <TableCell className="text-center text-slate-400">
              <ChevronRight size={20} />
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
};
```

**Step 2:** Extract GroupDetail Container

**File:** `components/groups/GroupDetail.tsx`

```typescript
import React, { useState } from 'react';
import { Group } from '../types';
import { ArrowRight } from 'lucide-react';
import { GroupOverviewTab } from './GroupOverviewTab';
import { GroupMembersTab } from './GroupMembersTab';
import { GroupContributionsTab } from './GroupContributionsTab';
import { GroupMeetingsTab } from './GroupMeetingsTab';
import { GroupSettingsTab } from './GroupSettingsTab';

type DetailTab = 'Overview' | 'Members' | 'Contributions' | 'Meetings' | 'Settings';

interface GroupDetailProps {
  group: Group;
  onBack: () => void;
}

export const GroupDetail: React.FC<GroupDetailProps> = ({ group, onBack }) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('Overview');

  const tabs = [
    { id: 'Overview' as DetailTab, label: 'Overview' },
    { id: 'Members' as DetailTab, label: 'Members' },
    { id: 'Contributions' as DetailTab, label: 'Contributions' },
    { id: 'Meetings' as DetailTab, label: 'Meetings' },
    { id: 'Settings' as DetailTab, label: 'Settings' },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 bg-white">
        <button
          onClick={onBack}
          className="text-xs text-slate-500 hover:text-blue-600 mb-2 flex items-center gap-1 font-medium"
        >
          <ArrowRight size={12} className="rotate-180" /> Back to Groups
        </button>

        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl">
              {group.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{group.name}</h1>
              <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                <span className="font-mono bg-slate-100 px-1.5 rounded text-slate-600">
                  {group.code}
                </span>
                <span>{group.memberCount} Members</span>
                <span>{group.meetingDay}s</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase font-semibold">
              Group Fund Balance
            </p>
            <p className="text-3xl font-bold text-slate-900 tracking-tight">
              {group.fundBalance.toLocaleString()}{' '}
              <span className="text-lg text-slate-400 font-normal">RWF</span>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-8 border-b border-slate-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
        {activeTab === 'Overview' && <GroupOverviewTab group={group} />}
        {activeTab === 'Members' && <GroupMembersTab group={group} />}
        {activeTab === 'Contributions' && (
          <GroupContributionsTab group={group} />
        )}
        {activeTab === 'Meetings' && <GroupMeetingsTab group={group} />}
        {activeTab === 'Settings' && <GroupSettingsTab group={group} />}
      </div>
    </div>
  );
};
```

**Step 3:** Update Main Groups Component

**File:** `components/Groups.tsx` (Refactored)

```typescript
import React, { useState } from 'react';
import { useGroups } from '../hooks';
import { useAuth } from '../contexts/AuthContext';
import { Group } from '../types';
import { PageLayout, Section } from './layout';
import { GroupsList } from './groups/GroupsList';
import { GroupDetail } from './groups/GroupDetail';
import { CreateGroupModal } from './groups/CreateGroupModal';
import { Button, SearchInput } from './ui';
import { Plus, Upload } from 'lucide-react';

interface GroupsProps {
  onNavigate?: (view: ViewState) => void;
  institutionId?: string | null;
}

export const Groups: React.FC<GroupsProps> = ({ onNavigate, institutionId: institutionIdProp }) => {
  const { institutionId: authInstitutionId } = useAuth();
  const institutionId = institutionIdProp || authInstitutionId;

  const { groups, loading, error, refetch } = useGroups({
    includeMemberCounts: true,
    autoFetch: true,
  });

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (selectedGroup) {
    return (
      <GroupDetail
        group={selectedGroup}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  return (
    <PageLayout
      title="Groups (Ibimina)"
      actions={
        <>
          <Button variant="secondary" size="sm" leftIcon={<Upload size={16} />}>
            Bulk Upload
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            New Group
          </Button>
        </>
      }
    >
      <Section
        title="All Groups"
        headerActions={
          <SearchInput
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
            className="w-64"
          />
        }
      >
        {loading && <div>Loading...</div>}
        {error && <div>Error: {error}</div>}
        {!loading && !error && (
          <GroupsList
            groups={groups}
            onSelectGroup={setSelectedGroup}
            searchTerm={searchTerm}
          />
        )}
      </Section>

      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          refetch();
        }}
      />
    </PageLayout>
  );
};
```

---

## Phase 3: Visual Simplification Examples

### Example 3.1: Simplified Dashboard KPIs

**Before:** 6 KPI cards

**After:** 4-5 primary KPIs with better hierarchy

```typescript
// Simplified KPI layout
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <KpiCard
    title="Today's Collections"
    value={formatCurrency(data.kpis.today.received_total)}
    icon={DollarSign}
    variant="primary"
  />
  <KpiCard
    title="Allocated"
    value={data.kpis.today.allocated_count}
    icon={CheckCircle}
    variant="success"
  />
  <KpiCard
    title="Needs Attention"
    value={data.kpis.today.unallocated_count}
    icon={AlertCircle}
    variant="warning"
    alert={data.kpis.today.unallocated_count > 0}
  />
  <KpiCard
    title="7d Total"
    value={formatCurrency(data.kpis.last_days.received_total)}
    icon={TrendingUp}
    variant="default"
  />
</div>
```

### Example 3.2: Simplified Navigation

**Before:** Flat list of 10+ items

**After:** Grouped navigation with collapsible sections

```typescript
<nav className="flex-1 px-3 py-4 overflow-y-auto">
  {/* Core Section */}
  <div className="mb-6">
    <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
      Core
    </p>
    <NavItem view={ViewState.DASHBOARD} icon={<LayoutDashboard />} label="Dashboard" />
    <NavItem view={ViewState.GROUPS} icon={<Briefcase />} label="Groups" />
    <NavItem view={ViewState.MEMBERS} icon={<Users />} label="Members" />
  </div>

  {/* Finance Section */}
  <div className="mb-6">
    <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
      Finance
    </p>
    <NavItem view={ViewState.TRANSACTIONS} icon={<CreditCard />} label="Transactions" />
    <NavItem view={ViewState.REPORTS} icon={<PieChart />} label="Reports" />
  </div>

  {/* System Section (Admin Only) */}
  {isAdmin && (
    <div>
      <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
        System
      </p>
      <NavItem view={ViewState.INSTITUTIONS} icon={<Building />} label="Institutions" />
      <NavItem view={ViewState.STAFF} icon={<ShieldCheck />} label="Staff" />
      <NavItem view={ViewState.SETTINGS} icon={<Settings />} label="Settings" />
    </div>
  )}
</nav>
```

---

## Testing Checklist

### Component Testing
- [ ] All components render without errors
- [ ] Props are correctly typed
- [ ] Components handle loading states
- [ ] Components handle error states
- [ ] Components handle empty states

### Visual Testing
- [ ] Consistent spacing across pages
- [ ] Colors match design tokens
- [ ] Typography is consistent
- [ ] Borders and shadows are minimal
- [ ] Mobile layouts are responsive

### User Testing
- [ ] Navigation is intuitive
- [ ] Forms are easy to complete
- [ ] Tables are readable
- [ ] Actions are clear
- [ ] Feedback is immediate

---

## Migration Strategy

### Step-by-Step Migration

1. **Week 1:** Create design system (tokens, base components)
2. **Week 2:** Refactor one large component (Groups) as proof of concept
3. **Week 3:** Refactor remaining large components (Members, Reports)
4. **Week 4:** Apply visual simplifications across all pages
5. **Week 5:** Mobile optimization and testing
6. **Week 6:** Final polish and documentation

### Backward Compatibility

- Keep old components until new ones are fully tested
- Use feature flags for gradual rollout
- Maintain API compatibility
- Document breaking changes

---

## Success Criteria

### Code Metrics
- [ ] Average component size < 250 lines
- [ ] No component > 400 lines
- [ ] 80%+ code reuse in UI components
- [ ] 100% components use design tokens

### User Experience
- [ ] Page load time < 2 seconds
- [ ] Mobile usability score > 90
- [ ] Accessibility score > 95
- [ ] User satisfaction > 4.5/5

### Visual Consistency
- [ ] Consistent spacing (measured)
- [ ] Unified color usage (audited)
- [ ] Standardized typography (verified)
- [ ] Minimal visual clutter (reviewed)

---

## Conclusion

This detailed implementation plan provides step-by-step guidance for refactoring the UI/UX. Follow the phases sequentially, test thoroughly at each step, and maintain backward compatibility during migration.

**Estimated Effort:** 6 weeks  
**Risk Level:** Medium  
**Priority:** High
