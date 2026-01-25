# QA Regression Checklist

Manual verification checklist for Staff/Admin RBAC and critical flows.

## Pre-requisites
- [ ] Dev server running: `npm run dev`
- [ ] Test users seeded in database (staff@test.com, admin@test.com)

---

## 1. Authentication Tests

| Test | Staff | Admin | Pass? |
|------|-------|-------|-------|
| Login with valid credentials | ✓ | ✓ | |
| Login shows error for invalid password | ✓ | ✓ | |
| Logout clears session | ✓ | ✓ | |
| Protected routes redirect to login when unauthenticated | ✓ | ✓ | |

---

## 2. Staff RBAC - UI Enforcement

| Test | Expected | Actual | Pass? |
|------|----------|--------|-------|
| Staff cannot see "Institutions" in nav | Hidden | | |
| Staff cannot see "Staff" in nav | Hidden | | |
| Staff cannot see "Settings" in nav | Hidden | | |
| Staff CAN see "Dashboard" in nav | Visible | | |
| Staff CAN see "Transactions" in nav | Visible | | |
| Staff CAN see "Groups" in nav | Visible | | |
| Staff CAN see "Members" in nav | Visible | | |

---

## 3. Staff RBAC - Direct URL Attack

| Route | Expected | Actual | Pass? |
|-------|----------|--------|-------|
| `/institutions` | Access Denied or redirect | | |
| `/settings` | Access Denied or redirect | | |
| `/staff` | Access Denied or redirect | | |
| `/sms-gateway` | Access Denied or redirect | | |

---

## 4. Admin RBAC - Full Access

| Test | Expected | Actual | Pass? |
|------|----------|--------|-------|
| Admin CAN see all nav items | Visible | | |
| Admin CAN access /institutions | Loads | | |
| Admin CAN access /settings | Loads | | |
| Admin CAN access /staff | Loads | | |

---

## 5. Critical Flows

| Flow | Steps | Pass? |
|------|-------|-------|
| Dashboard loads KPIs | Login → Dashboard shows stats | |
| View transactions | Navigate → Table loads | |
| Filter unallocated | Select filter → Results update | |
| Create group | Groups → New → Fill form → Save | |
| Create member | Members → New → Fill form → Save | |

---

## Evidence Collection

For each failure, capture:
1. **Screenshot** - `cmd+shift+4` or browser devtools
2. **Console errors** - DevTools → Console tab
3. **Network requests** - DevTools → Network tab (look for 4xx/5xx)

---

## Issue Log Template

```markdown
## Issue ID: QA-001
**Title**: [Brief description]
**Severity**: Critical / High / Medium / Low
**Steps to Reproduce**:
1. ...
2. ...

**Expected**: [What should happen]
**Actual**: [What actually happens]
**Evidence**: [Screenshot path or link]
**Root Cause Hypothesis**: [Your guess]
```
