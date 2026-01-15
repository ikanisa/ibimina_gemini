# UX Specification: SACCO+ Admin Portal

## 1. Role Capability Matrix

| Feature | Platform Admin | Institution Admin | Institution Staff | Institution Auditor |
| :--- | :---: | :---: | :---: | :---: |
| **Dashboard** | ✅ | ✅ | ✅ | ✅ |
| **Transactions** | ✅ (All) | ✅ (Inst) | ✅ (Inst) | 👁️ View Only |
| **Members/Groups** | ✅ | ✅ | ✅ | 👁️ View Only |
| **Reports** | ✅ | ✅ | ✅ | ✅ |
| **Staff Mgmt** | ✅ | ✅ | ❌ | ❌ |
| **Settings** | ✅ | ✅ | ❌ | ❌ |
| **SMS Gateway** | ✅ | ✅ | ❌ | ❌ |
| **Institutions** | ✅ | ❌ | ❌ | ❌ |

**Key:**
- ✅ Full Access (Create/Read/Update/Delete)
- 👁️ View Only (Read)
- ❌ No Access

## 2. Navigation Architecture

### Desktop (Sidebar)
Persistent left sidebar with collapsible primary navigation.

- **Main**
    - Dashboard (Home)
    - Transactions (Ledger)
    - Groups
    - Members
- **Analytics**
    - Reports
- **Admin** (Guarded)
    - Staff
    - Institutions (Platform Admin only)
    - Settings
    - SMS Gateway

### Mobile (Bottom Nav)
Condensed navigation for primary operational tasks.

- **Tabs**:
    1.  **Home** (Dashboard)
    2.  **Ledger** (Transactions)
    3.  **Directory** (Members/Groups)
    4.  **Menu** (More -> Settings, Reports, Profile)

## 3. Route & State Guards
*Current Architecture: State-based View Switching (`ViewState` enum)*

- **Guard Logic**: `canAccess(view)` function in `App.tsx` prevents rendering of restricted views.
- **Access Denied UX**: dedicated "Access Denied" component state vs redirect.
- **Deep Linking Strategy**:
    - *Current*: URL might not reflect state (Needs verification).
    - *Target*: Sync `ViewState` with URL params or hash to allow deep linking (e.g., `/?view=transactions`).

## 4. States Inventory
All screens must support:
- **Loading**: Skeleton UI (preferable to spinners).
- **Empty**: "No transactions found" with CTA "Add Transaction".
- **Error**: "Failed to load data" with "Retry" button.
- **Success**: Toast notification for actions (e.g., "Allocation Saved").

## 5. Visual Direction
**"Soft Liquid Glass"** (Internal Tool Optimized)
- **Backgrounds**: Subtle gradients, strictly limited to structural separation.
- **Cards**: `bg-white/80` with `backdrop-blur-md` only if it doesn't compromise text contrast.
- **Borders**: Very subtle `border-slate-200/50`.
- **Text**: High contrast `slate-900` for primary, `slate-500` for secondary. No "glass text".

## 6. Screen Specifications (Phase 1)

### 6.1 Dashboard
- **Primary Goal**: Immediate operational awareness.
- **Layout**: Grid of KPI cards (top) + Needs Attention list (bottom/side).
- **Components**:
    - `KPICard`: Icon + Label + Value + Trend.
    - `NeedsAttentionList`: List of urgent tasks (e.g., "3 Unallocated Transactions").

### 6.2 Transactions (Ledger)
- **Primary Goal**: View, filter, and allocate transactions.
- **Layout**: Full-width data table with sticky header and sidebar filters.
- **Components**:
    - `TransactionTable`: Virtualized, columns for Date, Amount, Sender, Status.
    - `TransactionDrawer`: Slide-over for allocation details.
    - `FilterBar`: Date range, Status, Amount range.

### 6.3 Directory (Groups/Members)
- **Primary Goal**: Manage entity registry.
- **Layout**: Split view or Master-Detail.
- **Components**:
    - `GroupCard` / `MemberRow`: Entity representation.
    - `WizardModal`: Multi-step form for creating new groups/members.

### 6.4 Reports
- **Primary Goal**: Data extraction and analysis.
- **Layout**: Parameter selection (top) + Preview area (bottom).
- **Components**:
    - `ReportGeneratorForm`: Select Scope, Date Range, Format.
    - `ReportPreview`: HTML table of results.
    - `ExportButton`: CSV/PDF download.

## 7. Mandatory Portal Patterns
1.  **Forms**: floating labels not required, but clear labels above inputs. Validation inline.
2.  **Tables**: Zebra striping optional, hover state mandatory. Pagination controls always visible.
3.  **Toasts**: Bottom-right (desktop) / Bottom-center (mobile).
4.  **Modals**: Use `Dialog` for critical alerts, `Sheet/Drawer` for complex forms.

