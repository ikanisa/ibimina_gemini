# User Acceptance Testing (UAT) Checklist

**Version:** 1.0  
**Date:** 2026-01-07  
**Environment:** Staging  
**Prepared by:** Development Team

---

## 📋 Pre-UAT Setup

### Environment Verification

- [ ] Staging database has production-like seed data
- [ ] All migrations applied successfully
- [ ] Edge functions deployed
- [ ] Environment variables configured
- [ ] SSL/HTTPS working
- [ ] PWA install available

### Test Accounts Created

| Role | Email | Institution | Status |
|------|-------|-------------|--------|
| PLATFORM_ADMIN | platform@staging.test | All | ⬜ |
| INSTITUTION_ADMIN (A) | admin-a@staging.test | Institution A | ⬜ |
| INSTITUTION_ADMIN (B) | admin-b@staging.test | Institution B | ⬜ |
| INSTITUTION_STAFF (A) | staff-a@staging.test | Institution A | ⬜ |
| INSTITUTION_STAFF (B) | staff-b@staging.test | Institution B | ⬜ |
| INSTITUTION_AUDITOR (A) | auditor-a@staging.test | Institution A | ⬜ |
| INSTITUTION_TREASURER (A) | treasurer-a@staging.test | Institution A | ⬜ |

---

## 🔐 Authentication & Authorization

### Login Flow

| # | Scenario | Steps | Expected Result | Role | Pass/Fail |
|---|----------|-------|-----------------|------|-----------|
| 1.1 | Valid login | Enter valid credentials → Submit | Redirect to Dashboard | Any | ⬜ |
| 1.2 | Invalid password | Enter wrong password → Submit | Error message, no redirect | Any | ⬜ |
| 1.3 | Invalid email | Enter non-existent email → Submit | Error message, no redirect | Any | ⬜ |
| 1.4 | Session persistence | Login → Close browser → Reopen | Still logged in (until session expires) | Any | ⬜ |
| 1.5 | Logout | Click logout | Redirect to login page | Any | ⬜ |

### Authorization

| # | Scenario | Steps | Expected Result | Role | Pass/Fail |
|---|----------|-------|-----------------|------|-----------|
| 2.1 | Staff cannot access Institutions | Navigate to /institutions | Redirected or Forbidden | Staff | ⬜ |
| 2.2 | Auditor read-only | Try to allocate transaction | Button disabled or action blocked | Auditor | ⬜ |
| 2.3 | Admin can manage staff | Go to Settings → Staff → Add | Staff invite form appears | Admin | ⬜ |
| 2.4 | Platform admin full access | Navigate all pages | All features accessible | Platform Admin | ⬜ |

---

## 📊 Dashboard

| # | Scenario | Steps | Expected Result | Role | Pass/Fail |
|---|----------|-------|-----------------|------|-----------|
| 3.1 | KPI cards display | Load dashboard | 4-6 KPI cards with numbers | Staff | ⬜ |
| 3.2 | Unallocated preview | Check "Needs Attention" | Shows unallocated count + preview | Staff | ⬜ |
| 3.3 | Parse errors preview | Check dashboard | Shows parse error count if any | Staff | ⬜ |
| 3.4 | Recent activity | Scroll to activity feed | Shows last 10-15 events | Staff | ⬜ |
| 3.5 | System health dot | Check top bar | Health indicator visible (green/amber/red) | Staff | ⬜ |
| 3.6 | Health drawer | Click health dot | Drawer opens with issue list | Staff | ⬜ |
| 3.7 | Institution scoping | Compare A vs B dashboards | Each shows only their data | Admin (both) | ⬜ |

---

## 💰 Transactions

| # | Scenario | Steps | Expected Result | Role | Pass/Fail |
|---|----------|-------|-----------------|------|-----------|
| 4.1 | Transactions list loads | Navigate to Transactions | Table with transactions appears | Staff | ⬜ |
| 4.2 | Filter by status | Select "Unallocated" filter | Only unallocated transactions shown | Staff | ⬜ |
| 4.3 | Filter by date | Set date range last 7 days | Transactions within range shown | Staff | ⬜ |
| 4.4 | Search by reference | Type MoMo ref in search | Matching transactions shown | Staff | ⬜ |
| 4.5 | Transaction detail | Click on a row | Detail drawer opens | Staff | ⬜ |
| 4.6 | Allocate transaction | Open unallocated → Allocate → Select member → Confirm | Status changes to "Allocated" | Staff | ⬜ |
| 4.7 | Allocation audit log | After allocation, check audit | TX_ALLOCATED event exists | Staff | ⬜ |
| 4.8 | Infinite scroll | Scroll to bottom of list | More transactions load | Staff | ⬜ |
| 4.9 | Institution isolation | Login as Staff B | Only Institution B transactions visible | Staff B | ⬜ |

---

## 🔄 Reconciliation

| # | Scenario | Steps | Expected Result | Role | Pass/Fail |
|---|----------|-------|-----------------|------|-----------|
| 5.1 | Unallocated tab | Click Unallocated tab | Shows unallocated transactions queue | Staff | ⬜ |
| 5.2 | Parse errors tab | Click Parse Errors tab | Shows SMS parse failures | Staff | ⬜ |
| 5.3 | Duplicates tab | Click Duplicates tab | Shows potential duplicate groups | Staff | ⬜ |
| 5.4 | Allocate from queue | Select item → Allocate | Transaction moves to allocated | Staff | ⬜ |
| 5.5 | Retry parse | Select error → Retry | Parse reattempted, status updates | Staff | ⬜ |
| 5.6 | Mark as ignored | Select error → Mark Ignored | Item marked as ignored | Staff | ⬜ |
| 5.7 | Mark duplicate | Select duplicate → Confirm | Transaction marked as duplicate | Staff | ⬜ |
| 5.8 | Audit events | After each action | Corresponding audit log entry | Staff | ⬜ |

---

## 👥 Groups

| # | Scenario | Steps | Expected Result | Role | Pass/Fail |
|---|----------|-------|-----------------|------|-----------|
| 6.1 | Groups list | Navigate to Groups | Table with groups appears | Staff | ⬜ |
| 6.2 | Search groups | Type group name | Matching groups shown | Staff | ⬜ |
| 6.3 | Create group (wizard) | Click New Group → Fill name → Continue → Create | Group created, listed | Staff | ⬜ |
| 6.4 | Group detail | Click on group row | Detail page/drawer with members | Staff | ⬜ |
| 6.5 | Edit group | Open group → Edit → Save | Changes saved | Staff | ⬜ |
| 6.6 | Bulk import groups | Click Import → Upload CSV → Preview → Import | Groups created from CSV | Staff | ⬜ |
| 6.7 | Import validation | Upload CSV with errors | Errors shown, invalid rows highlighted | Staff | ⬜ |
| 6.8 | Download template | Click Download Template | CSV template downloads | Staff | ⬜ |

---

## 👤 Members

| # | Scenario | Steps | Expected Result | Role | Pass/Fail |
|---|----------|-------|-----------------|------|-----------|
| 7.1 | Members list | Navigate to Members | Table with members appears | Staff | ⬜ |
| 7.2 | Filter by group | Select group filter | Only members in that group shown | Staff | ⬜ |
| 7.3 | Search members | Type member name/phone | Matching members shown | Staff | ⬜ |
| 7.4 | Create member (wizard) | New → Fill name/phone → Select group → Create | Member created | Staff | ⬜ |
| 7.5 | Member detail | Click on member row | Detail page with transaction history | Staff | ⬜ |
| 7.6 | Edit member | Open member → Edit → Save | Changes saved | Staff | ⬜ |
| 7.7 | Bulk import members | Click Import → Upload CSV → Preview → Import | Members created from CSV | Staff | ⬜ |
| 7.8 | Import with group resolution | CSV has group_code column | Groups correctly matched | Staff | ⬜ |
| 7.9 | Duplicate phone warning | Enter existing phone | Warning shown | Staff | ⬜ |

---

## 📈 Reports

| # | Scenario | Steps | Expected Result | Role | Pass/Fail |
|---|----------|-------|-----------------|------|-----------|
| 8.1 | Reports page loads | Navigate to Reports | KPIs + filters visible | Staff | ⬜ |
| 8.2 | Institution report | Select scope: Institution | Institution-wide totals shown | Staff | ⬜ |
| 8.3 | Group report | Select scope: Group → Pick group | Group breakdown shown | Staff | ⬜ |
| 8.4 | Member report | Select scope: Member → Pick member | Member statement shown | Staff | ⬜ |
| 8.5 | Filter by date | Set custom date range | Data filtered to range | Staff | ⬜ |
| 8.6 | Filter by status | Select status filter | Data filtered by status | Staff | ⬜ |
| 8.7 | Export CSV | Click Export → Download | CSV file downloads with correct data | Staff | ⬜ |
| 8.8 | Deep link to group report | Visit /reports/group/:id | Report pre-filtered for that group | Staff | ⬜ |

---

## ⚙️ Settings

| # | Scenario | Steps | Expected Result | Role | Pass/Fail |
|---|----------|-------|-----------------|------|-----------|
| 9.1 | Settings home | Navigate to Settings | Settings tiles/cards visible | Staff | ⬜ |
| 9.2 | Institution settings | Click Institution tile | Institution profile editable | Admin | ⬜ |
| 9.3 | Set primary MoMo code | Add/set primary code | Code appears as primary | Admin | ⬜ |
| 9.4 | Parsing settings | Click Parsing tile | Parser mode, threshold editable | Admin | ⬜ |
| 9.5 | SMS sources list | Click SMS Sources | Active sources listed | Admin | ⬜ |
| 9.6 | Add SMS source | Click Add → Fill form | Source registered | Admin | ⬜ |
| 9.7 | Deactivate source | Click Deactivate on source | Source marked inactive | Admin | ⬜ |
| 9.8 | Staff management | Click Staff tile | Staff list with invite button | Admin | ⬜ |
| 9.9 | Invite staff | Click Invite → Enter email/role | Invite sent/created | Admin | ⬜ |
| 9.10 | Audit log filters | Open Audit Log → Apply filters | Filtered results shown | Admin/Auditor | ⬜ |
| 9.11 | Audit log pagination | Scroll to load more | More events load | Admin/Auditor | ⬜ |

---

## 🏛️ Institutions (Platform Admin Only)

| # | Scenario | Steps | Expected Result | Role | Pass/Fail |
|---|----------|-------|-----------------|------|-----------|
| 10.1 | Institutions list | Navigate to Institutions | Table with all institutions | Platform Admin | ⬜ |
| 10.2 | Create institution | Click New → Fill form → Create | Institution created | Platform Admin | ⬜ |
| 10.3 | Institution detail | Click on institution | Detail page with tabs | Platform Admin | ⬜ |
| 10.4 | Set primary MoMo code | Add MoMo code → Mark primary | Primary badge appears | Platform Admin | ⬜ |
| 10.5 | View staff list | Go to Staff tab | Staff for that institution shown | Platform Admin | ⬜ |
| 10.6 | Reassign staff | Change staff institution | Staff moved to new institution | Platform Admin | ⬜ |

---

## 📱 Mobile Responsiveness

| # | Scenario | Steps | Expected Result | Device | Pass/Fail |
|---|----------|-------|-----------------|--------|-----------|
| 11.1 | Dashboard mobile | Open on mobile | Cards stack vertically | Phone | ⬜ |
| 11.2 | Navigation mobile | Tap hamburger menu | Sidebar slides in | Phone | ⬜ |
| 11.3 | Tables mobile | View transactions on mobile | Responsive cards or horizontal scroll | Phone | ⬜ |
| 11.4 | Forms mobile | Fill allocation form | Form fields usable | Phone | ⬜ |
| 11.5 | PWA install | Click install prompt | App installs to home screen | Phone | ⬜ |

---

## 🔔 Edge Cases & Error Handling

| # | Scenario | Steps | Expected Result | Pass/Fail |
|---|----------|-------|-----------------|-----------|
| 12.1 | Network error | Disconnect network → Perform action | Graceful error message | ⬜ |
| 12.2 | Session expired | Wait for session timeout → Perform action | Redirect to login | ⬜ |
| 12.3 | Invalid form submission | Submit form with missing required fields | Validation errors shown | ⬜ |
| 12.4 | Concurrent edit conflict | Two users edit same record | Appropriate conflict handling | ⬜ |
| 12.5 | Empty states | View page with no data | Friendly empty state message | ⬜ |
| 12.6 | Large data load | View institution with 1000+ transactions | Pagination/scroll works smoothly | ⬜ |

---

## ✅ Sign-Off

### UAT Completed By

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Product Owner | | | |
| Institution Admin (User Rep) | | | |
| Development Lead | | | |

### Issues Found

| Issue # | Description | Severity | Status |
|---------|-------------|----------|--------|
| | | | |
| | | | |
| | | | |

### Final Approval

- [ ] All critical scenarios passed
- [ ] All high-priority issues resolved
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Mobile experience acceptable

**Approved for Production:** ⬜ Yes / ⬜ No

**Date:** ________________

**Approver:** ________________

---

## 📝 Notes

### Test Data Requirements

1. **Institutions**: At least 2 (A and B)
2. **Groups per institution**: At least 5
3. **Members per institution**: At least 50
4. **Transactions**: At least 200 (mix of allocated/unallocated)
5. **Parse errors**: At least 5 for reconciliation testing
6. **Audit events**: At least 50 for filtering tests

### Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)

### Performance Baseline

- Dashboard load: < 3 seconds
- Transactions list (initial): < 2 seconds
- Infinite scroll: < 1 second per load
- Report generation: < 5 seconds
- CSV export (1000 rows): < 10 seconds

