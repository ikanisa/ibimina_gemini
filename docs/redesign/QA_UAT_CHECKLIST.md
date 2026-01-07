# QA/UAT Checklist

## Overview

This checklist covers end-to-end testing of the redesigned SACCO/ibimina operations PWA. Test each page and workflow to ensure full functionality.

## Pre-Test Setup

- [ ] Run migration `20260107000000_redesign_consolidated_schema.sql`
- [ ] Run seed `005_redesign_demo_data.sql`
- [ ] Verify 2 institutions, 3 staff, 10 groups, 100 members, 300 transactions, 40 unallocated exist
- [ ] Deploy Edge Functions: `parse-momo-sms`, `bulk-import-groups`, `bulk-import-members`
- [ ] Clear browser cache / use incognito
- [ ] Test on mobile device (responsive) and desktop

---

## 1. Dashboard

### Visual Checks
- [ ] Dashboard loads without errors
- [ ] KPIs display correctly:
  - [ ] Today's collections
  - [ ] This week's total
  - [ ] Unallocated count (should show 40)
  - [ ] Reconciliation issues count
- [ ] Alerts card shows "X transactions need allocation"
- [ ] Institution filter (admin only) works
- [ ] Recent activity feed shows recent transactions/actions

### Data Validation
- [ ] KPIs match actual data from database
- [ ] Clicking unallocated count navigates to Allocation Queue
- [ ] Clicking reconciliation issues navigates to Reconciliations

**Test Cases:**
1. Login as admin → Verify can see all institutions
2. Login as staff → Verify can only see their institution
3. Refresh page → Data persists correctly

---

## 2. Transactions

### Visual Checks
- [ ] Transactions table loads
- [ ] Columns: Date, Member, Group, Amount, Status, Reference
- [ ] Filters work: Date range, Member, Group, Amount, Status
- [ ] Search by member name/phone works
- [ ] Pagination/infinite scroll works

### Transaction Drawer
- [ ] Click transaction row → Drawer opens (not new page)
- [ ] Drawer shows:
  - [ ] Raw SMS text
  - [ ] Parsed fields (amount, payer, momo_ref)
  - [ ] Allocation status
  - [ ] Audit trail (who allocated, when)
- [ ] "Allocate" button appears if unallocated
- [ ] "View Member" link works (opens member drawer)

### Data Validation
- [ ] All 300 transactions visible (filtered by institution)
- [ ] 260 allocated, 40 unallocated
- [ ] Clicking "Allocate" opens member picker
- [ ] Transaction facts cannot be edited (no edit button)

**Test Cases:**
1. Filter by "Unallocated" → Shows 40 transactions
2. Filter by date range → Only shows transactions in range
3. Search member name → Filters correctly
4. Allocate transaction → Status changes to "allocated", member assigned

---

## 3. Allocation Queue

### Visual Checks
- [ ] Queue page loads
- [ ] Shows list of unallocated transactions
- [ ] Mobile: Cards view
- [ ] Desktop: Table view
- [ ] Filters: Date range, amount range

### Allocation Workflow
- [ ] Click "Assign to Member" → Member picker opens
- [ ] Member picker:
  - [ ] Search by phone works
  - [ ] Search by name works
  - [ ] Search by member code works
  - [ ] Shows member's group name
  - [ ] Shows member's institution
- [ ] Select member → Confirmation dialog
- [ ] Confirm → Transaction allocated
- [ ] Transaction removed from queue (or marked allocated)

### Data Validation
- [ ] Only shows unallocated transactions
- [ ] Cannot assign member from different institution
- [ ] Allocation creates record in `transaction_allocations`
- [ ] Audit log entry created

**Test Cases:**
1. Allocate transaction → Transaction moves to "allocated" status
2. Try to allocate with member from different institution → Error shown
3. Bulk allocate (if implemented) → Multiple transactions allocated

---

## 4. Groups

### Visual Checks
- [ ] Groups list loads
- [ ] Shows: Name, Code, Members Count, Fund Balance, Status
- [ ] Search/filter works
- [ ] "Create Group" button visible

### Create Wizard
- [ ] Click "Create Group" → Wizard opens
- [ ] Step 1: Basic info
  - [ ] Name (required)
  - [ ] Code (optional)
  - [ ] Expected amount (required)
  - [ ] Frequency (Weekly/Monthly)
- [ ] Step 2: Meeting details
  - [ ] Meeting day
  - [ ] Cycle label
- [ ] Step 3: Review → Create
- [ ] Group created → Redirects to group detail

### Group Detail
- [ ] Tabs: Overview, Members, Contributions, Reports
- [ ] Overview: Stats, next meeting, fund balance
- [ ] Members: List of group members
- [ ] Contributions: Transactions filtered to this group
- [ ] Reports: Summary charts

### Bulk Upload
- [ ] "Bulk Upload" button visible
- [ ] Upload CSV → Shows preview
- [ ] Validate rows → Shows errors if any
- [ ] Import → Calls Edge Function
- [ ] Shows row-by-row results (success/errors)

**Test Cases:**
1. Create group → Appears in list
2. Upload CSV with 5 groups → All imported successfully
3. Upload CSV with invalid data → Errors shown per row
4. View group detail → All tabs load correctly

---

## 5. Members

### Visual Checks
- [ ] Members list loads
- [ ] Shows: Name, Phone, Group, Status, Balance
- [ ] Search/filter works

### Create Wizard
- [ ] Click "Create Member" → Wizard opens
- [ ] Step 1: Personal info
  - [ ] Full name (required)
  - [ ] Phone (required, validated)
  - [ ] Member code (optional)
- [ ] Step 2: Group assignment
  - [ ] Group picker (filtered by institution)
  - [ ] Cannot select group from different institution
- [ ] Step 3: Review → Create
- [ ] Member created → Appears in list

### Member Detail
- [ ] Shows: Identity, group, institution
- [ ] Contribution timeline (transactions)
- [ ] Exceptions/warnings (if any)
- [ ] Quick view drawer (not full page)

### Bulk Upload
- [ ] "Bulk Upload" button visible
- [ ] Upload CSV → Shows preview
- [ ] Validate rows → Shows errors if any
- [ ] Import → Calls Edge Function
- [ ] Shows row-by-row results
- [ ] Creates `group_members` entries automatically

**Test Cases:**
1. Create member → Appears in list, assigned to group
2. Try to assign to group from different institution → Error shown
3. Upload CSV with 10 members → All imported
4. View member detail → Contribution timeline shows transactions

---

## 6. Reports

### Visual Checks
- [ ] Reports page loads
- [ ] Predefined reports listed:
  - [ ] Collections by Group
  - [ ] Member Contributions
  - [ ] Institution Summary
  - [ ] Unallocated Transactions Aging

### Report Views
- [ ] Select report → Data displays
- [ ] Filters: Date range, Group, Institution (admin only)
- [ ] Charts/tables render correctly
- [ ] Export CSV works
- [ ] Export PDF works (if implemented)

### Data Validation
- [ ] Collections by Group matches actual transaction data
- [ ] Member Contributions shows correct totals
- [ ] Institution Summary shows correct KPIs
- [ ] Unallocated Aging shows oldest unallocated first

**Test Cases:**
1. Generate "Collections by Group" report → Data accurate
2. Export to CSV → File downloads correctly
3. Filter by date range → Report updates

---

## 7. Reconciliations

### Visual Checks
- [ ] Reconciliations page loads
- [ ] Shows active sessions
- [ ] "Open New Session" button visible

### Session Workflow
- [ ] Open new session → Session created, status "open"
- [ ] View issues in session:
  - [ ] Duplicate transactions
  - [ ] SMS parse failures
  - [ ] MoMo code mismatches
- [ ] Resolve issue:
  - [ ] Link to transaction (if applicable)
  - [ ] Add resolution notes
  - [ ] Mark resolved
- [ ] Close session → Status changes to "closed"

### Data Validation
- [ ] Duplicate detection works (same SMS hash)
- [ ] Parse failures shown (SMS with parse_status='error')
- [ ] Resolution creates record in `reconciliation_items`
- [ ] Audit log entry created

**Test Cases:**
1. Open session → Issues detected and listed
2. Resolve issue → Status changes to "resolved"
3. Close session → All issues resolved or ignored

---

## 8. Institutions (Admin Only)

### Visual Checks
- [ ] Institutions page loads (admin only)
- [ ] List all institutions
- [ ] "Create Institution" button visible

### CRUD Operations
- [ ] Create institution:
  - [ ] Name, type, code, supervisor
  - [ ] Add MoMo codes (multiple)
  - [ ] Save → Institution created
- [ ] Edit institution:
  - [ ] Update details
  - [ ] Add/remove MoMo codes
  - [ ] View assigned staff
- [ ] View details:
  - [ ] Groups/members counts
  - [ ] Transaction summary
  - [ ] MoMo codes list

### Data Validation
- [ ] MoMo codes associated correctly
- [ ] Staff assignment visible
- [ ] Counts match actual data

**Test Cases:**
1. Create institution → Appears in list
2. Add MoMo code → Code associated
3. Staff member sees only their institution (not all)

---

## 9. Staff/User Management (Admin Only)

### Visual Checks
- [ ] Staff page loads (admin only)
- [ ] List all staff (or institution staff for staff user)
- [ ] "Add Staff" button visible

### CRUD Operations
- [ ] Create staff:
  - [ ] Email, name, role
  - [ ] Assign to institution (required for staff)
  - [ ] Create → Auth user created, profile created
- [ ] Edit staff:
  - [ ] Change institution
  - [ ] Suspend/activate
  - [ ] Update role
- [ ] View permissions matrix (if implemented)

### Data Validation
- [ ] Staff can only see their institution (RLS enforced)
- [ ] Admin can see all institutions
- [ ] Suspended staff cannot login

**Test Cases:**
1. Create staff → Appears in list, assigned to institution
2. Login as staff → Only sees their institution data
3. Suspend staff → Staff cannot login

---

## 10. Settings

### Visual Checks
- [ ] Settings page loads (admin only)
- [ ] Sections: Contribution configs, Parsing rules, Templates

### Configuration
- [ ] Update contribution configs → Saved
- [ ] Update MoMo parsing patterns → Saved
- [ ] Download bulk upload templates → CSV downloads

**Test Cases:**
1. Update settings → Changes persist
2. Download template → File downloads correctly

---

## Cross-Cutting Tests

### RLS (Row Level Security)
- [ ] Staff user only sees their institution's data
- [ ] Admin user sees all institutions
- [ ] Cannot access other institution's data via direct API calls

### Mobile Responsiveness
- [ ] All pages work on mobile (< 768px)
- [ ] Bottom nav appears on mobile
- [ ] Sidebar hidden on mobile, hamburger menu works
- [ ] Tables become cards on mobile
- [ ] Drawers slide in from side

### Performance
- [ ] Pages load < 2 seconds
- [ ] Large lists (100+ items) paginate/infinite scroll
- [ ] No infinite loading spinners
- [ ] Real-time updates work (if implemented)

### Error Handling
- [ ] Network error → Error message shown, retry button
- [ ] Invalid data → Validation errors shown
- [ ] Permission denied → Access denied message
- [ ] Not found → 404 or empty state

### PWA Features
- [ ] App installable (manifest works)
- [ ] Works offline (service worker)
- [ ] Push notifications (if implemented)

---

## Edge Function Tests

### parse-momo-sms
- [ ] Send SMS text → Transaction created
- [ ] Invalid SMS → Parse error logged
- [ ] Phone matches member → Auto-allocated
- [ ] Phone doesn't match → Unallocated

### bulk-import-groups
- [ ] Upload CSV → Groups imported
- [ ] Invalid rows → Errors returned per row
- [ ] All rows imported → Success count matches

### bulk-import-members
- [ ] Upload CSV → Members imported
- [ ] Group names resolved → Members assigned to groups
- [ ] Invalid rows → Errors returned per row

---

## Database Function Tests

### allocate_transaction()
- [ ] Allocate valid transaction → Success
- [ ] Try to allocate already-allocated → Error
- [ ] Try to allocate with different institution member → Error
- [ ] Allocation creates audit log entry

### parse_momo_sms()
- [ ] Parse SMS → Transaction created
- [ ] Auto-match by phone → Transaction allocated
- [ ] Parse error → SMS marked as error

---

## Regression Tests

- [ ] Login/logout works
- [ ] Password change works
- [ ] Profile update works
- [ ] No console errors
- [ ] No broken images/links
- [ ] Cloudflare Pages build succeeds
- [ ] No infinite loading on any page

---

## Sign-Off

**Tester Name:** _______________
**Date:** _______________
**Environment:** _______________ (Dev/Staging/Prod)
**Overall Status:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________


