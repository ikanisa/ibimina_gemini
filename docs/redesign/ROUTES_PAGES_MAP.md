# Routes & Pages Map

## Overview

This document maps all required pages to routes and their implementation status. The app uses a view-state pattern (not React Router) but each view should map to a logical route for bookmarking/sharing.

## Core Pages (Required)

### 1. Dashboard
**Route:** `/` or `/dashboard`
**Component:** `components/Dashboard.tsx` / `components/SupabaseDashboard.tsx`
**Access:** All roles
**Purpose:** "What's broken + what changed today?"

**Features:**
- KPIs: Today's collections, This week, Unallocated count, Reconciliation issues
- Alerts card: "X transactions need allocation", "Y duplicates detected"
- Filter: Institution (admin only)
- Recent activity feed
- Quick actions

**Data Sources:**
- `transactions` (aggregated by date, status)
- `reconciliation_items` (open issues)
- `audit_log` (recent actions)

**Status:** ✅ Exists (needs update for new schema)

---

### 2. Transactions
**Route:** `/transactions`
**Component:** `components/Transactions.tsx`
**Access:** All roles
**Purpose:** Fast search + audit-grade history

**Features:**
- Table with filters:
  - Date range
  - Member (search by name/phone)
  - Group
  - Amount
  - Status (Allocated/Unallocated/Error/Duplicate)
- Transaction Drawer (not new page):
  - Raw SMS text (from `momo_sms_raw`)
  - Parsed fields
  - Allocation status
  - Audit trail (from `transaction_allocations`)
- Actions:
  - Allocate (if unallocated)
  - View member (opens drawer)
  - Mark as duplicate (if applicable)

**Data Sources:**
- `transactions` (with joins to `members`, `groups`, `momo_sms_raw`)
- `transaction_allocations` (allocation history)

**Status:** ✅ Exists (needs update for new schema)

---

### 3. Allocation Queue
**Route:** `/queue` or `/allocation-queue`
**Component:** `components/AllocationQueue.tsx` (NEW)
**Access:** Staff + Admin
**Purpose:** "Inbox zero" for unallocated transactions

**Features:**
- List of unallocated transactions (`allocation_status='unallocated'`)
- Cards (mobile) / Table (desktop)
- One-click "Assign to Member":
  - Member picker supports:
    - Search by phone/name/member code
    - Shows member's group + institution before confirm
- Bulk allocation (optional)
- Filter by date range, amount range

**Data Sources:**
- `transactions` (WHERE `allocation_status='unallocated'`)
- `members` (for picker)

**Actions:**
- Calls `allocate_transaction(transaction_id, member_id)` function

**Status:** ❌ Needs to be created

---

### 4. Groups
**Route:** `/groups`
**Component:** `components/Groups.tsx`
**Access:** All roles
**Purpose:** Group lifecycle + roster + ledger view

**Features:**
- List view (with search/filter)
- Create wizard (step-by-step):
  1. Basic info (name, code, frequency, amount)
  2. Meeting details (day, cycle)
  3. Review & create
- Bulk upload (CSV):
  - Calls `bulk-import-groups` Edge Function
  - Shows row-by-row results
- Group detail tabs:
  - Overview (stats, next meeting, fund balance)
  - Members (list from `group_members`)
  - Contributions (transactions filtered to this group)
  - Reports snapshot

**Data Sources:**
- `groups`
- `group_members`
- `transactions` (filtered by group_id)

**Status:** ✅ Exists (needs update for new schema)

---

### 5. Members
**Route:** `/members`
**Component:** `components/Members.tsx`
**Access:** All roles
**Purpose:** Member onboarding + contribution timeline

**Features:**
- List view (with search/filter)
- Create wizard (onboarding):
  1. Personal info (name, phone, member code)
  2. Group assignment (must belong to same institution)
  3. Review & create
- Bulk upload (CSV):
  - Calls `bulk-import-members` Edge Function
  - Shows row-by-row results
- Member detail:
  - Identity + group + institution
  - Contribution timeline (from transactions, filtered by member_id)
  - Exceptions (e.g., phone mismatch warnings)
  - Quick view drawer (not full page)

**Data Sources:**
- `members`
- `group_members`
- `transactions` (filtered by member_id)

**Status:** ✅ Exists (needs update for new schema)

---

### 6. Reports
**Route:** `/reports`
**Component:** `components/Reports.tsx` (NEW or enhance existing)
**Access:** All roles
**Purpose:** Predefined reports + exports

**Features:**
- Predefined reports:
  - "Collections by Group" (daily/weekly/monthly)
  - "Member Contributions" (by member, by period)
  - "Institution Summary" (overview KPIs)
  - "Unallocated Transactions Aging" (how long unallocated)
- Filters: Date range, Group, Institution (admin only)
- Exports: CSV/PDF
- Custom report builder (optional, future)

**Data Sources:**
- `transactions` (aggregated)
- `groups`, `members` (for grouping)
- SQL views (recommended for performance)

**Status:** ⚠️ Partial (needs enhancement)

---

### 7. Reconciliations
**Route:** `/reconciliations`
**Component:** `components/Reconciliation.tsx`
**Access:** Staff + Admin (Auditor role)
**Purpose:** Anomaly hunting, not accounting cosplay

**Features:**
- Session workflow:
  - Open new session
  - View active sessions
  - Close session
- Issues list:
  - Duplicate detection
  - SMS parse failures
  - MoMo code mismatches
  - Institution mapping errors
- Resolution:
  - Link to transaction
  - Add resolution notes
  - Mark resolved

**Data Sources:**
- `reconciliation_sessions`
- `reconciliation_items`
- `transactions`
- `momo_sms_raw`

**Status:** ✅ Exists (needs update for new schema)

---

### 8. Institutions
**Route:** `/institutions`
**Component:** `components/Saccos.tsx` (rename or create new)
**Access:** Admin only
**Purpose:** Institution CRUD + MoMo code management

**Features:**
- List all institutions (admin only)
- Create/Edit institution:
  - Basic info (name, type, code)
  - MoMo codes (multiple codes per institution)
  - Assigned staff (from profiles)
- View details:
  - Groups/members counts
  - Transaction summary
  - MoMo codes list

**Data Sources:**
- `institutions`
- `institution_momo_codes`
- `profiles` (for staff assignment)

**Status:** ✅ Exists as "Saccos" (needs update for new schema + MoMo codes)

---

### 9. Staff/User Management
**Route:** `/staff`
**Component:** `components/Staff.tsx`
**Access:** Admin only
**Purpose:** Staff CRUD + institution assignment

**Features:**
- List all staff (admin sees all, staff sees only their institution)
- Create staff:
  - Email, name, role
  - Assign to institution (required for staff, optional for admin)
- Edit staff:
  - Change institution
  - Suspend/activate
- Permissions matrix (if needed)

**Data Sources:**
- `profiles`
- `auth.users` (via Supabase Auth)

**Status:** ✅ Exists (needs update for new schema)

---

### 10. Settings
**Route:** `/settings`
**Component:** `components/Settings.tsx`
**Access:** Admin only
**Purpose:** System configuration

**Features:**
- Contribution configs (if any)
- Parsing rules mapping (MoMo patterns)
- Templates for bulk upload
- System preferences

**Data Sources:**
- `settings` (per institution)

**Status:** ✅ Exists (needs enhancement)

---

## Navigation Structure

### Mobile (Bottom Nav)
Shows top 4-5 pages:
1. Dashboard
2. Transactions
3. Allocation Queue
4. Groups
5. Members

### Desktop (Left Sidebar)
All pages listed, grouped:
- **Core:** Dashboard, Groups, Members
- **Finance:** Transactions, Allocation Queue
- **Operations:** Reconciliations
- **Reports:** Reports
- **System:** Institutions (admin), Staff (admin), Settings (admin)

---

## Route Protection

### Role-Based Access
- **Admin (`PLATFORM_ADMIN`, `INSTITUTION_ADMIN`):** All pages
- **Staff (`INSTITUTION_STAFF`):** Dashboard, Transactions, Queue, Groups, Members, Reports, Reconciliations
- **Other roles:** Per role permissions

### Institution Scoping
- All data automatically filtered by `institution_id` via RLS
- Admin can see all institutions (global view)
- Staff only sees their institution

---

## Implementation Notes

### Drawers vs Pages
- **Transaction Drawer:** Opens from Transactions list, shows details (not a route)
- **Member Quick View:** Opens from anywhere, shows member summary (not a route)
- **Group Quick View:** Opens from Groups list, shows summary (not a route)

### Data Fetching
- All pages use Supabase client directly (no mock data)
- Use React Query or similar for caching
- Real-time subscriptions for live updates (optional)

### Error Handling
- Show error states (no data, network error)
- Retry mechanisms
- Offline support (PWA)

---

## Status Summary

- ✅ Exists and working: Dashboard, Groups, Members, Transactions, Reconciliations, Institutions, Staff, Settings
- ⚠️ Exists but needs update: All existing pages (schema changes)
- ❌ Needs creation: Allocation Queue (new page)
- 📝 Needs enhancement: Reports (add predefined reports + exports)

